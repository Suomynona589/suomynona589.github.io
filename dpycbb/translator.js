var Translator = (function () {
  function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  function trimLine(line) {
    return line.replace(/^\s+|\s+$/g, "");
  }

  function isBlank(line) {
    return trimLine(line).length === 0;
  }

  function parse(source) {
    var lines = normalizeLineEndings(source).split("\n");
    var events = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      var t = trimLine(line);
      if (t.startsWith("on-message:")) {
        var result = parseEventBody(lines, i + 1);
        events.push({
          type: "on_message",
          body: result.body
        });
        i = result.nextIndex;
        continue;
      }
      if (t.startsWith("on-ready:")) {
        var resultReady = parseEventBody(lines, i + 1);
        events.push({
          type: "on_ready",
          body: resultReady.body
        });
        i = resultReady.nextIndex;
        continue;
      }
      i += 1;
    }
    return {
      events: events
    };
  }

  function parseEventBody(lines, startIndex) {
    var body = [];
    var i = startIndex;
    while (i < lines.length) {
      var line = lines[i];
      if (trimLine(line).startsWith("on-message:") || trimLine(line).startsWith("on-ready:")) {
        break;
      }
      if (isBlank(line)) {
        i += 1;
        continue;
      }
      var t = trimLine(line);
      if (t === "createChannel:") {
        var blockResult = parseCreateChannelBlock(lines, i);
        body.push(blockResult.node);
        i = blockResult.nextIndex;
        continue;
      }
      var node = parseSimpleActionLine(t);
      if (node) {
        body.push(node);
      } else {
        body.push({
          kind: "raw",
          value: t
        });
      }
      i += 1;
    }
    return {
      body: body,
      nextIndex: i
    };
  }

  function parseCreateChannelBlock(lines, startIndex) {
    var type = null;
    var title = null;
    var category = null;
    var i = startIndex + 1;
    while (i < lines.length) {
      var t = trimLine(lines[i]);
      if (isBlank(t)) {
        i += 1;
        continue;
      }
      if (t.startsWith("on-message:") || t.startsWith("on-ready:") || t === "createChannel:") {
        break;
      }
      if (t.toLowerCase().startsWith("type:")) {
        type = trimLine(t.slice(5));
      } else if (t.toLowerCase().startsWith("title:")) {
        title = trimQuotes(trimLine(t.slice(6)));
      } else if (t.toLowerCase().startsWith("category:")) {
        category = trimQuotes(trimLine(t.slice(9)));
      }
      i += 1;
    }
    var node = {
      kind: "createChannel",
      channelType: type,
      title: title,
      category: category
    };
    return {
      node: node,
      nextIndex: i
    };
  }

  function trimQuotes(s) {
    if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
      return s.slice(1, -1);
    }
    return s;
  }

  function parseSimpleActionLine(t) {
    if (t.startsWith("send(")) {
      var sendNode = parseSend(t);
      if (sendNode) {
        return sendNode;
      }
    }
    if (t.startsWith("reply(")) {
      var replyNode = parseReply(t);
      if (replyNode) {
        return replyNode;
      }
    }
    if (t.startsWith("dm(")) {
      var dmNode = parseDm(t);
      if (dmNode) {
        return dmNode;
      }
    }
    if (t.startsWith("react(")) {
      var reactNode = parseReact(t);
      if (reactNode) {
        return reactNode;
      }
    }
    if (t.startsWith("createCategory(")) {
      var catNode = parseCreateCategory(t);
      if (catNode) {
        return catNode;
      }
    }
    if (t.startsWith("if ")) {
      return {
        kind: "ifRaw",
        condition: t.slice(3)
      };
    }
    return null;
  }

  function parseSend(t) {
    var mTwo = t.match(/^send\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (mTwo) {
      return {
        kind: "send",
        channel: mTwo[1],
        text: mTwo[2]
      };
    }
    var mOne = t.match(/^send\("([^"]*)"\)$/);
    if (mOne) {
      return {
        kind: "send",
        channel: null,
        text: mOne[1]
      };
    }
    return null;
  }

  function parseReply(t) {
    var m = t.match(/^reply\("([^"]*)"\)$/);
    if (m) {
      return {
        kind: "reply",
        text: m[1]
      };
    }
    return null;
  }

  function parseDm(t) {
    var m = t.match(/^dm\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (m) {
      return {
        kind: "dm",
        userId: m[1],
        text: m[2]
      };
    }
    return null;
  }

  function parseReact(t) {
    var m = t.match(/^react\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (m) {
      return {
        kind: "react",
        messageId: m[1],
        emoji: m[2]
      };
    }
    return null;
  }

  function parseCreateCategory(t) {
    var m = t.match(/^createCategory\("([^"]*)"\)$/);
    if (m) {
      return {
        kind: "createCategory",
        title: m[1]
      };
    }
    return null;
  }

  function buildHeader() {
    var code = "";
    code += "import asyncio\n";
    code += "import discord\n";
    code += "from discord.ext import commands\n\n";
    code += "intents = discord.Intents.all()\n";
    code += 'bot = commands.Bot(command_prefix="!", intents=intents)\n\n';
    return code;
  }

  function generate(ast) {
    var code = "";
    var hasReady = false;
    var hasMessage = false;
    for (var i = 0; i < ast.events.length; i++) {
      var ev = ast.events[i];
      if (ev.type === "on_ready") {
        hasReady = true;
        code += generateOnReady(ev);
        code += "\n";
      }
      if (ev.type === "on_message") {
        hasMessage = true;
        code += generateOnMessage(ev);
        code += "\n";
      }
    }
    if (!hasReady) {
      code += "@bot.event\n";
      code += "async def on_ready():\n";
      code += '    print(f"Logged in as {bot.user} (ID: {bot.user.id})")\n';
      code += '    print("------")\n\n";
    }
    if (!hasMessage) {
      code += "@bot.event\n";
      code += "async def on_message(message):\n";
      code += "    if message.author.bot:\n";
      code += "        return\n";
      code += "    await bot.process_commands(message)\n\n";
    }
    return code;
  }

  function generateOnReady(ev) {
    var code = "";
    code += "@bot.event\n";
    code += "async def on_ready():\n";
    if (!ev.body.length) {
      code += '    print(f"Logged in as {bot.user} (ID: {bot.user.id})")\n";
      code += '    print("------")\n";
      return code;
    }
    for (var i = 0; i < ev.body.length; i++) {
      code += generateStatement(ev.body[i], "ready");
    }
    return code;
  }

  function generateOnMessage(ev) {
    var code = "";
    code += "@bot.event\n";
    code += "async def on_message(message):\n";
    code += "    if message.author.bot:\n";
    code += "        return\n";
    for (var i = 0; i < ev.body.length; i++) {
      code += generateStatement(ev.body[i], "message");
    }
    code += "    await bot.process_commands(message)\n";
    return code;
  }

  function generateStatement(node, context) {
    if (node.kind === "send") {
      return generateSend(node, context);
    }
    if (node.kind === "reply") {
      return generateReply(node, context);
    }
    if (node.kind === "dm") {
      return generateDm(node, context);
    }
    if (node.kind === "react") {
      return generateReact(node, context);
    }
    if (node.kind === "createCategory") {
      return generateCreateCategory(node, context);
    }
    if (node.kind === "createChannel") {
      return generateCreateChannel(node, context);
    }
    if (node.kind === "ifRaw") {
      return generateIfRaw(node, context);
    }
    if (node.kind === "raw") {
      return "    " + "pass\n";
    }
    return "";
  }

  function generateSend(node, context) {
    var code = "";
    if (node.channel === null) {
      if (context === "message") {
        code += '    await message.channel.send("' + escapePyString(node.text) + '")\n';
      } else {
        code += '    channel = None\n';
        code += '    if len(bot.guilds) > 0:\n';
        code += "        channel = bot.guilds[0].text_channels[0]\n";
        code += "    if channel is not None:\n";
        code += '        await channel.send("' + escapePyString(node.text) + '")\n';
      }
    } else {
      code += '    channel = bot.get_channel(int("' + escapePyString(node.channel) + '"))\n';
      code += "    if channel is not None:\n";
      code += '        await channel.send("' + escapePyString(node.text) + '")\n';
    }
    return code;
  }

  function generateReply(node, context) {
    var code = "";
    if (context === "message") {
      code += '    await message.reply("' + escapePyString(node.text) + '")\n';
    } else {
      code += "    pass\n";
    }
    return code;
  }

  function generateDm(node, context) {
    var code = "";
    code += '    user = bot.get_user(int("' + escapePyString(node.userId) + '"))\n';
    code += "    if user is not None:\n";
    code += '        await user.send("' + escapePyString(node.text) + '")\n';
    return code;
  }

  function generateReact(node, context) {
    var code = "";
    if (context === "message") {
      code += '    target = await message.channel.fetch_message(int("' + escapePyString(node.messageId) + '"))\n';
      code += '    await target.add_reaction("' + escapePyString(node.emoji) + '")\n';
    } else {
      code += "    pass\n";
    }
    return code;
  }

  function generateCreateCategory(node, context) {
    var code = "";
    if (context === "message") {
      code += "    if message.guild is not None:\n";
      code += '        await message.guild.create_category("' + escapePyString(node.title) + '")\n';
    } else {
      code += "    for guild in bot.guilds:\n";
      code += '        await guild.create_category("' + escapePyString(node.title) + '")\n';
    }
    return code;
  }

  function generateCreateChannel(node, context) {
    var code = "";
    var typeExpr = "discord.ChannelType.text";
    if (node.channelType) {
      var t = node.channelType.toLowerCase();
      if (t.indexOf("voice") !== -1) {
        typeExpr = "discord.ChannelType.voice";
      } else if (t.indexOf("announcement") !== -1) {
        typeExpr = "discord.ChannelType.news";
      } else if (t.indexOf("stage") !== -1) {
        typeExpr = "discord.ChannelType.stage_voice";
      } else if (t.indexOf("forum") !== -1) {
        typeExpr = "discord.ChannelType.forum";
      }
    }
    var title = node.title || "new-channel";
    if (context === "message") {
      code += "    guild = message.guild\n";
      code += "    if guild is not None:\n";
      if (node.category) {
        code += '        category = discord.utils.get(guild.categories, name="' + escapePyString(node.category) + '")\n';
        code += "        if category is None:\n";
        code += '            category = await guild.create_category("' + escapePyString(node.category) + '")\n';
        code += '        await guild.create_text_channel("' + escapePyString(title) + '", category=category)\n';
      } else {
        code += '        await guild.create_text_channel("' + escapePyString(title) + '")\n';
      }
    } else {
      code += "    for guild in bot.guilds:\n";
      if (node.category) {
        code += '        category = discord.utils.get(guild.categories, name="' + escapePyString(node.category) + '")\n';
        code += "        if category is None:\n";
        code += '            category = await guild.create_category("' + escapePyString(node.category) + '")\n';
        code += '        await guild.create_text_channel("' + escapePyString(title) + '", category=category)\n';
      } else {
        code += '        await guild.create_text_channel("' + escapePyString(title) + '")\n';
      }
    }
    return code;
  }

  function generateIfRaw(node, context) {
    var code = "";
    code += "    if True:\n";
    code += "        pass\n";
    return code;
  }

  function escapePyString(s) {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function buildRunner(token) {
    var safeToken = token.replace(/"/g, '\\"');
    var code = "";
    code += "def run_bot():\n";
    code += '    bot.run("' + safeToken + '")\n\n';
    code += 'if __name__ == "__main__":\n';
    code += "    run_bot()\n";
    return code;
  }

  function translate(source, token) {
    var ast = parse(source);
    var code = "";
    code += buildHeader();
    code += generate(ast);
    code += buildRunner(token);
    return code;
  }

  return {
    translate: translate
  };
})();
