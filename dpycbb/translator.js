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

  function startsWithIgnoreCase(line, prefix) {
    return line.toLowerCase().startsWith(prefix.toLowerCase());
  }

  function parse(source) {
    var lines = normalizeLineEndings(source).split("\n");
    var mode = null;
    var events = [];
    var prefixes = {
      prefixChar: null,
      commands: []
    };
    var commands = [];
    var i = 0;

    while (i < lines.length) {
      var raw = lines[i];
      var t = trimLine(raw);

      if (t.startsWith("#")) {
        var lower = t.toLowerCase();
        if (lower === "# events") {
          mode = "events";
          i += 1;
          continue;
        }
        if (lower === "# prefixes") {
          mode = "prefixes";
          i += 1;
          continue;
        }
        if (lower === "# commands") {
          mode = "commands";
          i += 1;
          continue;
        }
      }

      if (mode === "events") {
        var evResult = parseEventSection(lines, i);
        if (evResult) {
          events.push(evResult.event);
          i = evResult.nextIndex;
          continue;
        }
      }

      if (mode === "prefixes") {
        if (!prefixes.prefixChar && t.startsWith("#") && t.length > 1 && t[1] === " ") {
          var pfx = t.slice(2).trim();
          if (pfx.length === 1) {
            prefixes.prefixChar = pfx;
            i += 1;
            continue;
          }
        }
        var pfxResult = parsePrefixCommand(lines, i);
        if (pfxResult) {
          prefixes.commands.push(pfxResult.command);
          i = pfxResult.nextIndex;
          continue;
        }
      }

      if (mode === "commands") {
        var cmdResult = parseSlashCommand(lines, i);
        if (cmdResult) {
          commands.push(cmdResult.command);
          i = cmdResult.nextIndex;
          continue;
        }
      }

      i += 1;
    }

    return {
      events: events,
      prefixes: prefixes,
      commands: commands
    };
  }

  function skipHashLines(lines, index) {
    var i = index;
    while (i < lines.length) {
      var t = trimLine(lines[i]);
      if (!t.startsWith("#") || isBlank(t)) break;
      i += 1;
    }
    return i;
  }

  function parseEventSection(lines, index) {
    var i = index;
    var t = trimLine(lines[i]);
    if (!t.startsWith("# el")) return null;
    i += 1;
    i = skipHashLines(lines, i);
    if (i >= lines.length) return null;
    var header = trimLine(lines[i]);
    if (!startsWithIgnoreCase(header, "on-message:") &&
        !startsWithIgnoreCase(header, "on-ready:") &&
        !startsWithIgnoreCase(header, "on-interaction:")) {
      return null;
    }
    var evType = null;
    if (startsWithIgnoreCase(header, "on-message:")) evType = "on_message";
    if (startsWithIgnoreCase(header, "on-ready:")) evType = "on_ready";
    if (startsWithIgnoreCase(header, "on-interaction:")) evType = "on_interaction";
    i += 1;
    var bodyResult = parseStatementsBlock(lines, i, ["# el", "# events", "# prefixes", "# commands"]);
    return {
      event: {
        type: evType,
        body: bodyResult.body
      },
      nextIndex: bodyResult.nextIndex
    };
  }

  function parsePrefixCommand(lines, index) {
    var i = index;
    var t = trimLine(lines[i]);
    if (!t.toLowerCase().startsWith("# pfx")) return null;
    i += 1;
    var name = null;
    while (i < lines.length) {
      var tt = trimLine(lines[i]);
      if (tt.startsWith("# \"")) {
        name = tt.slice(2).trim();
        if (name.startsWith("\"") && name.endsWith("\"")) {
          name = name.slice(1, -1);
        }
        i += 1;
        break;
      }
      if (!tt.startsWith("#")) break;
      i += 1;
    }
    var fields = [];
    while (i < lines.length) {
      var line = trimLine(lines[i]);
      if (line.toLowerCase().startsWith("# pfx") ||
          line.toLowerCase() === "# commands" ||
          line.toLowerCase() === "# events") {
        break;
      }
      if (isBlank(line)) {
        i += 1;
        continue;
      }
      if (line.startsWith("field(")) {
        var f = parseField(line);
        if (f) fields.push(f);
        i += 1;
        continue;
      }
      break;
    }
    var bodyResult = parseStatementsBlock(lines, i, ["# pfx", "# commands", "# events", "# prefixes"]);
    return {
      command: {
        name: name,
        fields: fields,
        body: bodyResult.body
      },
      nextIndex: bodyResult.nextIndex
    };
  }

  function parseField(line) {
    var m = line.match(/^field\("([^"]+)"\s*,\s*"([^"]+)"\)/);
    if (!m) return null;
    return {
      index: m[1],
      label: m[2]
    };
  }

  function parseSlashCommand(lines, index) {
    var i = index;
    var t = trimLine(lines[i]);
    if (!t.toLowerCase().startsWith("# cmd")) return null;
    i += 1;
    var name = null;
    var description = "";
    while (i < lines.length) {
      var tt = trimLine(lines[i]);
      if (tt.startsWith("# \"") && !name) {
        var n = tt.slice(2).trim();
        if (n.startsWith("\"") && n.endsWith("\"")) n = n.slice(1, -1);
        name = n;
        i += 1;
        continue;
      }
      if (tt.startsWith("# \"") && name && !description) {
        var d = tt.slice(2).trim();
        if (d.startsWith("\"") && d.endsWith("\"")) d = d.slice(1, -1);
        description = d;
        i += 1;
        continue;
      }
      if (!tt.startsWith("#")) break;
      i += 1;
    }
    var args = [];
    var permissions = null;
    while (i < lines.length) {
      var line = trimLine(lines[i]);
      if (line.toLowerCase().startsWith("# cmd") ||
          line.toLowerCase() === "# events" ||
          line.toLowerCase() === "# prefixes") {
        break;
      }
      if (isBlank(line)) {
        i += 1;
        continue;
      }
      if (line.startsWith("arg(")) {
        var argRes = parseArgBlock(lines, i);
        args.push(argRes.arg);
        i = argRes.nextIndex;
        continue;
      }
      if (startsWithIgnoreCase(line, "permissions:")) {
        permissions = trimLine(line.slice("permissions:".length));
        i += 1;
        continue;
      }
      break;
    }
    var bodyResult = parseStatementsBlock(lines, i, ["# cmd", "# events", "# prefixes", "# commands"]);
    return {
      command: {
        name: name,
        description: description,
        args: args,
        permissions: permissions,
        body: bodyResult.body
      },
      nextIndex: bodyResult.nextIndex
    };
  }

  function parseArgBlock(lines, index) {
    var header = trimLine(lines[index]);
    var m = header.match(/^arg\("([^"]+)"\s*,\s*"([^"]+)"\):/);
    if (!m) {
      return {
        arg: null,
        nextIndex: index + 1
      };
    }
    var name = m[1];
    var desc = m[2];
    var type = "text";
    var required = false;
    var maxLength = null;
    var i = index + 1;
    while (i < lines.length) {
      var t = trimLine(lines[i]);
      if (isBlank(t)) {
        i += 1;
        continue;
      }
      if (t.startsWith("arg(") ||
          t.toLowerCase().startsWith("# cmd") ||
          t.toLowerCase() === "# events" ||
          t.toLowerCase() === "# prefixes" ||
          t.toLowerCase() === "# commands" ||
          !t.includes(":")) {
        break;
      }
      var parts = t.split(":");
      var key = parts[0].trim().toLowerCase();
      var value = parts.slice(1).join(":").trim();
      if (key === "type") {
        type = value.replace(/,$/, "").trim();
      } else if (key === "required") {
        required = value.replace(/,$/, "").trim().toLowerCase() === "true";
      } else if (key === "max-length") {
        maxLength = parseInt(value.replace(/,$/, "").trim(), 10);
      }
      i += 1;
    }
    return {
      arg: {
        name: name,
        description: desc,
        type: type,
        required: required,
        maxLength: maxLength
      },
      nextIndex: i
    };
  }

  function parseStatementsBlock(lines, index, stopMarkers) {
    var body = [];
    var i = index;
    while (i < lines.length) {
      var raw = lines[i];
      var t = trimLine(raw);
      if (isBlank(t)) {
        i += 1;
        continue;
      }
      var lower = t.toLowerCase();
      var shouldStop = false;
      for (var s = 0; s < stopMarkers.length; s++) {
        if (lower.startsWith(stopMarkers[s].toLowerCase())) {
          shouldStop = true;
          break;
        }
      }
      if (shouldStop) break;

      if (startsWithIgnoreCase(t, "if ")) {
        var ifRes = parseIfBlock(lines, i, stopMarkers);
        body.push(ifRes.node);
        i = ifRes.nextIndex;
        continue;
      }

      if (t === "createChannel:") {
        var chRes = parseCreateChannelBlock(lines, i);
        body.push(chRes.node);
        i = chRes.nextIndex;
        continue;
      }

      var node = parseSimpleActionLine(t);
      if (node) {
        body.push(node);
      }
      i += 1;
    }
    return {
      body: body,
      nextIndex: i
    };
  }

  function parseIfBlock(lines, index, stopMarkers) {
    var header = trimLine(lines[index]);
    var condText = header.slice(3).trim();
    if (condText.endsWith(":")) condText = condText.slice(0, -1).trim();
    var i = index + 1;
    var bodyResult = parseStatementsBlock(lines, i, stopMarkers.concat(["if "]));
    return {
      node: {
        kind: "if",
        condition: condText,
        body: bodyResult.body
      },
      nextIndex: bodyResult.nextIndex
    };
  }

  function parseCreateChannelBlock(lines, index) {
    var type = null;
    var title = null;
    var category = null;
    var i = index + 1;
    while (i < lines.length) {
      var t = trimLine(lines[i]);
      if (isBlank(t)) {
        i += 1;
        continue;
      }
      var lower = t.toLowerCase();
      if (lower === "createchannel:" ||
          lower.startsWith("# el") ||
          lower === "# events" ||
          lower === "# prefixes" ||
          lower === "# commands" ||
          lower.startsWith("# pfx") ||
          lower.startsWith("# cmd") ||
          lower.startsWith("if ")) {
        break;
      }
      if (startsWithIgnoreCase(t, "type:")) {
        type = trimLine(t.slice(5));
      } else if (startsWithIgnoreCase(t, "title:")) {
        title = trimQuotes(trimLine(t.slice(6)));
      } else if (startsWithIgnoreCase(t, "category:")) {
        category = trimQuotes(trimLine(t.slice(9)));
      }
      i += 1;
    }
    return {
      node: {
        kind: "createChannel",
        channelType: type,
        title: title,
        category: category
      },
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
      if (sendNode) return sendNode;
    }
    if (t.startsWith("reply(")) {
      var replyNode = parseReply(t);
      if (replyNode) return replyNode;
    }
    if (t.startsWith("dm(")) {
      var dmNode = parseDm(t);
      if (dmNode) return dmNode;
    }
    if (t.startsWith("react(")) {
      var reactNode = parseReact(t);
      if (reactNode) return reactNode;
    }
    if (t.startsWith("createCategory(")) {
      var catNode = parseCreateCategory(t);
      if (catNode) return catNode;
    }
    if (t.startsWith("wait(")) {
      var waitNode = parseWait(t);
      if (waitNode) return waitNode;
    }
    if (t.startsWith("random(")) {
      var randNode = parseRandom(t);
      if (randNode) return randNode;
    }
    if (t.startsWith("defer(") || t === "defer()") {
      return { kind: "defer" };
    }
    if (t.startsWith("deleteVar(")) {
      var delNode = parseDeleteVar(t);
      if (delNode) return delNode;
    }
    if (t === "setVar:") {
      return { kind: "setVarBlockStart" };
    }
    return {
      kind: "rawAction",
      text: t
    };
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

  function parseWait(t) {
    var m = t.match(/^wait\("([^"]*)"\)$/);
    if (m) {
      return {
        kind: "wait",
        seconds: m[1]
      };
    }
    return null;
  }

  function parseRandom(t) {
    var m = t.match(/^random\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (m) {
      return {
        kind: "random",
        min: m[1],
        max: m[2]
      };
    }
    return null;
  }

  function parseDeleteVar(t) {
    var m = t.match(/^deleteVar\("([^"]*)"\)$/);
    if (m) {
      return {
        kind: "deleteVar",
        name: m[1]
      };
    }
    return null;
  }

  function buildHeader() {
    var code = "";
    code += "import asyncio\n";
    code += "import random\n";
    code += "import discord\n";
    code += "from discord.ext import commands\n";
    code += "from discord import app_commands\n\n";
    code += "intents = discord.Intents.all()\n";
    code += 'bot = commands.Bot(command_prefix="!", intents=intents)\n\n';
    return code;
  }

  function generate(ast) {
    var code = "";
    code += generateEvents(ast.events);
    code += generatePrefixSystem(ast.prefixes);
    code += generateSlashCommands(ast.commands);
    return code;
  }

  function generateEvents(events) {
    var hasReady = false;
    var hasMessage = false;
    var hasInteraction = false;
    var code = "";

    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev.type === "on_ready") {
        hasReady = true;
        code += "@bot.event\n";
        code += "async def on_ready():\n";
        if (!ev.body.length) {
          code += '    print(f"Logged in as {bot.user} (ID: {bot.user.id})")\n';
          code += '    print("------")\n\n';
        } else {
          for (var j = 0; j < ev.body.length; j++) {
            code += generateStatement(ev.body[j], "ready", "    ");
          }
          code += "\n";
        }
      }
      if (ev.type === "on_message") {
        hasMessage = true;
        code += "@bot.event\n";
        code += "async def on_message(message):\n";
        code += "    if message.author.bot:\n";
        code += "        return\n";
        for (var k = 0; k < ev.body.length; k++) {
          code += generateStatement(ev.body[k], "message", "    ");
        }
        code += "    await bot.process_commands(message)\n\n";
      }
      if (ev.type === "on_interaction") {
        hasInteraction = true;
        code += "@bot.event\n";
        code += "async def on_interaction(interaction):\n";
        for (var m = 0; m < ev.body.length; m++) {
          code += generateStatement(ev.body[m], "interaction", "    ");
        }
        code += "\n";
      }
    }

    if (!hasReady) {
      code += "@bot.event\n";
      code += "async def on_ready():\n";
      code += '    print(f"Logged in as {bot.user} (ID: {bot.user.id})")\n';
      code += '    print("------")\n\n';
    }
    if (!hasMessage) {
      code += "@bot.event\n";
      code += "async def on_message(message):\n";
      code += "    if message.author.bot:\n";
      code += "        return\n";
      code += "    await bot.process_commands(message)\n\n";
    }
    if (!hasInteraction) {
      code += "@bot.event\n";
      code += "async def on_interaction(interaction):\n";
      code += "    await bot.process_application_commands(interaction)\n\n";
    }

    return code;
  }

  function generatePrefixSystem(prefixes) {
    if (!prefixes.prefixChar || prefixes.commands.length === 0) return "";
    var code = "";
    code += "PREFIX = " + JSON.stringify(prefixes.prefixChar) + "\n\n";
    code += "@bot.event\n";
    code += "async def on_message(message):\n";
    code += "    if message.author.bot:\n";
    code += "        return\n";
    code += "    content = message.content\n";
    code += "    if not content.startswith(PREFIX):\n";
    code += "        await bot.process_commands(message)\n";
    code += "        return\n";
    code += "    without_prefix = content[len(PREFIX):]\n";
    code += "    parts = without_prefix.split()\n";
    code += "    if not parts:\n";
    code += "        await bot.process_commands(message)\n";
    code += "        return\n";
    code += "    cmd_name = parts[0]\n";
    code += "    args = parts[1:]\n";

    for (var i = 0; i < prefixes.commands.length; i++) {
      var pc = prefixes.commands[i];
      code += "    if cmd_name == " + JSON.stringify(pc.name) + ":\n";
      var maxIndex = 0;
      for (var f = 0; f < pc.fields.length; f++) {
        var idx = parseInt(pc.fields[f].index, 10);
        if (idx > maxIndex) maxIndex = idx;
      }
      if (maxIndex > 0) {
        code += "        if len(args) < " + maxIndex + ":\n";
        code += "            fmt = PREFIX + cmd_name";
        for (var f2 = 0; f2 < pc.fields.length; f2++) {
          code += " + ' ' + " + JSON.stringify(pc.fields[f2].label);
        }
        code += "\n";
        code += "            await message.channel.send('Format should be: ' + fmt)\n";
        code += "            return\n";
        for (var f3 = 0; f3 < pc.fields.length; f3++) {
          var idx2 = parseInt(pc.fields[f3].index, 10) - 1;
          code += "        " + "field_" + pc.fields[f3].label.replace(/[^a-zA-Z0-9_]/g, "_") + " = args[" + idx2 + "]\n";
        }
      }
      for (var b = 0; b < pc.body.length; b++) {
        code += generateStatement(pc.body[b], "prefix", "        ");
      }
      code += "        return\n";
    }

    code += "    await bot.process_commands(message)\n\n";
    return code;
  }

  function generateSlashCommands(commands) {
    if (!commands.length) return "";
    var code = "";
    code += "tree = bot.tree\n\n";
    for (var i = 0; i < commands.length; i++) {
      var cmd = commands[i];
      code += "@tree.command(name=" + JSON.stringify(cmd.name) + ", description=" + JSON.stringify(cmd.description || "") + ")\n";
      code += "async def " + safeName("cmd_" + cmd.name) + "(interaction";
      for (var a = 0; a < cmd.args.length; a++) {
        code += ", " + safeName(cmd.args[a].name);
      }
      code += "):\n";
      if (cmd.permissions) {
        code += "    perms = interaction.user.guild_permissions\n";
        code += "    if not perms.administrator:\n";
        code += "        await interaction.response.send_message('You do not have permission to use this command.', ephemeral=True)\n";
        code += "        return\n";
      }
      if (!cmd.body.length) {
        code += "    await interaction.response.send_message('Command not implemented.')\n\n";
        continue;
      }
      var firstResp = true;
      for (var b = 0; b < cmd.body.length; b++) {
        code += generateStatement(cmd.body[b], "slash", "    ", firstResp);
        if (cmd.body[b].kind === "send" || cmd.body[b].kind === "reply") {
          firstResp = false;
        }
      }
      code += "\n";
    }
    return code;
  }

  function safeName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  function generateStatement(node, context, indent, firstResponse) {
    if (!indent) indent = "";
    var code = "";
    if (node.kind === "if") {
      var pyCond = translateCondition(node.condition, context);
      code += indent + "if " + pyCond + ":\n";
      for (var i = 0; i < node.body.length; i++) {
        code += generateStatement(node.body[i], context, indent + "    ", firstResponse);
      }
      return code;
    }
    if (node.kind === "send") {
      return generateSend(node, context, indent, firstResponse);
    }
    if (node.kind === "reply") {
      return generateReply(node, context, indent, firstResponse);
    }
    if (node.kind === "dm") {
      return generateDm(node, context, indent);
    }
    if (node.kind === "react") {
      return generateReact(node, context, indent);
    }
    if (node.kind === "createCategory") {
      return generateCreateCategory(node, context, indent);
    }
    if (node.kind === "createChannel") {
      return generateCreateChannel(node, context, indent);
    }
    if (node.kind === "wait") {
      return indent + "await asyncio.sleep(" + safeNumber(node.seconds) + ")\n";
    }
    if (node.kind === "random") {
      return indent + "rand_value = random.randint(" + safeNumber(node.min) + ", " + safeNumber(node.max) + ")\n";
    }
    if (node.kind === "defer") {
      if (context === "slash") {
        return indent + "await interaction.response.defer()\n";
      }
      return indent + "pass\n";
    }
    if (node.kind === "deleteVar") {
      return indent + "# deleteVar(" + JSON.stringify(node.name) + ") not implemented in Python runtime\n";
    }
    if (node.kind === "rawAction") {
      return indent + "# " + node.text + "\n";
    }
    return indent + "pass\n";
  }

  function translateCondition(cond, context) {
    var c = cond.trim();
    var lower = c.toLowerCase();
    var target = null;
    var op = null;
    var modifier = null;
    var value = null;

    if (lower.startsWith("message.content")) {
      target = "message.content";
      var rest = c.slice("message.content".length);
      var parts = rest.split(".");
      var ops = ["contains", "startswith", "endswith", "greater", "less", "is"];
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (!p) continue;
        var base = p;
        var arg = null;
        if (p.includes("(")) {
          var idx = p.indexOf("(");
          base = p.slice(0, idx);
          arg = p.slice(idx + 1);
          if (arg.endsWith(")")) arg = arg.slice(0, -1);
          arg = arg.trim();
        }
        if (ops.indexOf(base.toLowerCase()) !== -1) {
          op = base.toLowerCase();
          if (arg) value = arg;
        } else if (base.toLowerCase() === "lower") {
          modifier = "lower";
        } else if (base.toLowerCase() === "upper") {
          modifier = "upper";
        }
      }
    }

    if (!target) return "True";

    var pyTarget = target;
    if (modifier === "lower") pyTarget = "(" + pyTarget + ").lower()";
    if (modifier === "upper") pyTarget = "(" + pyTarget + ").upper()";

    if (!op) return "True";

    if (value && value.startsWith("\"") && value.endsWith("\"")) {
      value = value;
    } else if (value) {
      value = JSON.stringify(value);
    }

    if (op === "contains") {
      return value + " in " + pyTarget;
    }
    if (op === "startswith") {
      return pyTarget + ".startswith(" + value + ")";
    }
    if (op === "endswith") {
      return pyTarget + ".endswith(" + value + ")";
    }
    if (op === "greater") {
      return "float(" + pyTarget + ") > float(" + (value || "0") + ")";
    }
    if (op === "less") {
      return "float(" + pyTarget + ") < float(" + (value || "0") + ")";
    }
    if (op === "is") {
      return pyTarget + " == " + value;
    }
    return "True";
  }

  function safeNumber(s) {
    if (!s) return "0";
    if (/^[0-9.]+$/.test(s)) return s;
    return "0";
  }

  function escapePyString(s) {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function replaceVarsInText(text, context) {
    if (typeof Variables !== "undefined" && Variables.replaceVariables) {
      return Variables.replaceVariables(text, context || {});
    }
    return text;
  }

  function generateSend(node, context, indent, firstResponse) {
    var txt = replaceVarsInText(node.text, null);
    if (context === "message") {
      if (node.channel === null) {
        return indent + 'await message.channel.send("' + escapePyString(txt) + '")\n';
      }
      return indent + 'channel = bot.get_channel(int("' + escapePyString(node.channel) + '"))\n' +
             indent + "if channel is not None:\n" +
             indent + '    await channel.send("' + escapePyString(txt) + '")\n';
    }
    if (context === "ready") {
      return indent + "# send not supported in on_ready without explicit channel\n";
    }
    if (context === "prefix") {
      if (node.channel === null) {
        return indent + 'await message.channel.send("' + escapePyString(txt) + '")\n';
      }
      return indent + 'channel = bot.get_channel(int("' + escapePyString(node.channel) + '"))\n' +
             indent + "if channel is not None:\n" +
             indent + '    await channel.send("' + escapePyString(txt) + '")\n';
    }
    if (context === "slash") {
      if (firstResponse) {
        return indent + 'await interaction.response.send_message("' + escapePyString(txt) + '")\n';
      }
      return indent + 'await interaction.followup.send("' + escapePyString(txt) + '")\n';
    }
    return indent + "pass\n";
  }

  function generateReply(node, context, indent, firstResponse) {
    var txt = replaceVarsInText(node.text, null);
    if (context === "message" || context === "prefix") {
      return indent + 'await message.reply("' + escapePyString(txt) + '")\n';
    }
    if (context === "slash") {
      if (firstResponse) {
        return indent + 'await interaction.response.send_message("' + escapePyString(txt) + '")\n';
      }
      return indent + 'await interaction.followup.send("' + escapePyString(txt) + '")\n';
    }
    return indent + "pass\n";
  }

  function generateDm(node, context, indent) {
    var txt = replaceVarsInText(node.text, null);
    return indent + 'user = bot.get_user(int("' + escapePyString(node.userId) + '"))\n' +
           indent + "if user is not None:\n" +
           indent + '    await user.send("' + escapePyString(txt) + '")\n';
  }

  function generateReact(node, context, indent) {
    if (context === "message" || context === "prefix") {
      return indent + 'target = await message.channel.fetch_message(int("' + escapePyString(node.messageId) + '"))\n' +
             indent + 'await target.add_reaction("' + escapePyString(node.emoji) + '")\n';
    }
    return indent + "pass\n";
  }

  function generateCreateCategory(node, context, indent) {
    var title = replaceVarsInText(node.title || "New Category", null);
    if (context === "message" || context === "prefix") {
      return indent + "if message.guild is not None:\n" +
             indent + '    await message.guild.create_category("' + escapePyString(title) + '")\n';
    }
    if (context === "ready") {
      return indent + "for guild in bot.guilds:\n" +
             indent + '    await guild.create_category("' + escapePyString(title) + '")\n';
    }
    return indent + "pass\n";
  }

  function generateCreateChannel(node, context, indent) {
    var title = replaceVarsInText(node.title || "new-channel", null);
    var categoryName = node.category ? replaceVarsInText(node.category, null) : null;
    if (context === "message" || context === "prefix") {
      var code = "";
      code += indent + "guild = message.guild\n";
      code += indent + "if guild is not None:\n";
      if (categoryName) {
        code += indent + '    category = discord.utils.get(guild.categories, name="' + escapePyString(categoryName) + '")\n';
        code += indent + "    if category is None:\n";
        code += indent + '        category = await guild.create_category("' + escapePyString(categoryName) + '")\n';
        code += indent + '    await guild.create_text_channel("' + escapePyString(title) + '", category=category)\n';
      } else {
        code += indent + '    await guild.create_text_channel("' + escapePyString(title) + '")\n';
      }
      return code;
    }
    if (context === "ready") {
      var code2 = "";
      code2 += indent + "for guild in bot.guilds:\n";
      if (categoryName) {
        code2 += indent + '    category = discord.utils.get(guild.categories, name="' + escapePyString(categoryName) + '")\n';
        code2 += indent + "    if category is None:\n";
        code2 += indent + '        category = await guild.create_category("' + escapePyString(categoryName) + '")\n';
        code2 += indent + '    await guild.create_text_channel("' + escapePyString(title) + '", category=category)\n';
      } else {
        code2 += indent + '    await guild.create_text_channel("' + escapePyString(title) + '")\n';
      }
      return code2;
    }
    return indent + "pass\n";
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

  function translate(source, token, ctx) {
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
