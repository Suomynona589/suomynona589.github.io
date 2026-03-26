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

  // ---------- PARSER ----------

  function parse(source) {
    var lines = normalizeLineEndings(source).split("\n");
    var mode = null;
    var events = [];
    var prefixes = { prefixChar: null, commands: [] };
    var commands = [];
    var i = 0;

    while (i < lines.length) {
      var raw = lines[i];
      var t = trimLine(raw);

      if (t.startsWith("#")) {
        var lower = t.toLowerCase();
        if (lower === "# events") {
          mode = "events";
          i++;
          continue;
        }
        if (lower === "# prefixes") {
          mode = "prefixes";
          i++;
          continue;
        }
        if (lower === "# commands") {
          mode = "commands";
          i++;
          continue;
        }
      }

      if (mode === "events") {
        var evRes = parseEventSection(lines, i);
        if (evRes) {
          events.push(evRes.event);
          i = evRes.nextIndex;
          continue;
        }
      }

      if (mode === "prefixes") {
        // first non-comment line after "# prefixes" can be prefix char like: "# ?"
        if (!prefixes.prefixChar && t.startsWith("#") && t.length > 2) {
          var maybe = t.slice(1).trim();
          if (maybe.length === 1) {
            prefixes.prefixChar = maybe;
            i++;
            continue;
          }
        }
        var pfxRes = parsePrefixCommand(lines, i);
        if (pfxRes) {
          prefixes.commands.push(pfxRes.command);
          i = pfxRes.nextIndex;
          continue;
        }
      }

      if (mode === "commands") {
        var cmdRes = parseSlashCommand(lines, i);
        if (cmdRes) {
          commands.push(cmdRes.command);
          i = cmdRes.nextIndex;
          continue;
        }
      }

      i++;
    }

    return { events: events, prefixes: prefixes, commands: commands };
  }

  function skipHashLines(lines, index) {
    var i = index;
    while (i < lines.length) {
      var t = trimLine(lines[i]);
      if (!t.startsWith("#") || isBlank(t)) break;
      i++;
    }
    return i;
  }

  function parseEventSection(lines, index) {
    var i = index;
    var t = trimLine(lines[i]);
    if (!t.toLowerCase().startsWith("# el")) return null;
    i++;
    i = skipHashLines(lines, i);
    if (i >= lines.length) return null;
    var header = trimLine(lines[i]);
    var evType = null;
    if (startsWithIgnoreCase(header, "on-message:")) evType = "on_message";
    else if (startsWithIgnoreCase(header, "on-ready:")) evType = "on_ready";
    else if (startsWithIgnoreCase(header, "on-interaction:")) evType = "on_interaction";
    else return null;
    i++;
    var bodyRes = parseStatementsBlock(lines, i, ["# el", "# events", "# prefixes", "# commands"]);
    return { event: { type: evType, body: bodyRes.body }, nextIndex: bodyRes.nextIndex };
  }

  function parsePrefixCommand(lines, index) {
    var i = index;
    var t = trimLine(lines[i]);
    if (!t.toLowerCase().startsWith("# pfx")) return null;
    i++;
    var name = null;
    while (i < lines.length) {
      var tt = trimLine(lines[i]);
      if (tt.startsWith("# \"")) {
        var n = tt.slice(2).trim();
        if (n.startsWith("\"") && n.endsWith("\"")) n = n.slice(1, -1);
        name = n;
        i++;
        break;
      }
      if (!tt.startsWith("#")) break;
      i++;
    }
    var fields = [];
    while (i < lines.length) {
      var line = trimLine(lines[i]);
      var lower = line.toLowerCase();
      if (lower.startsWith("# pfx") || lower === "# commands" || lower === "# events" || lower === "# prefixes") break;
      if (isBlank(line)) {
        i++;
        continue;
      }
      if (line.startsWith("field(")) {
        var f = parseField(line);
        if (f) fields.push(f);
        i++;
        continue;
      }
      break;
    }
    var bodyRes = parseStatementsBlock(lines, i, ["# pfx", "# commands", "# events", "# prefixes"]);
    return { command: { name: name, fields: fields, body: bodyRes.body }, nextIndex: bodyRes.nextIndex };
  }

  function parseField(line) {
    var m = line.match(/^field\("([^"]+)"\s*,\s*"([^"]+)"\)/);
    if (!m) return null;
    return { index: m[1], label: m[2] };
  }

  function parseSlashCommand(lines, index) {
    var i = index;
    var t = trimLine(lines[i]);
    if (!t.toLowerCase().startsWith("# cmd")) return null;
    i++;
    var name = null;
    var description = "";
    while (i < lines.length) {
      var tt = trimLine(lines[i]);
      if (tt.startsWith("# \"") && !name) {
        var n = tt.slice(2).trim();
        if (n.startsWith("\"") && n.endsWith("\"")) n = n.slice(1, -1);
        name = n;
        i++;
        continue;
      }
      if (tt.startsWith("# \"") && name && !description) {
        var d = tt.slice(2).trim();
        if (d.startsWith("\"") && d.endsWith("\"")) d = d.slice(1, -1);
        description = d;
        i++;
        continue;
      }
      if (!tt.startsWith("#")) break;
      i++;
    }
    var args = [];
    var permissions = null;
    while (i < lines.length) {
      var line = trimLine(lines[i]);
      var lower = line.toLowerCase();
      if (lower.startsWith("# cmd") || lower === "# events" || lower === "# prefixes" || lower === "# commands") break;
      if (isBlank(line)) {
        i++;
        continue;
      }
      if (line.startsWith("arg(")) {
        var argRes = parseArgBlock(lines, i);
        if (argRes.arg) args.push(argRes.arg);
        i = argRes.nextIndex;
        continue;
      }
      if (startsWithIgnoreCase(line, "permissions:")) {
        permissions = trimLine(line.slice("permissions:".length));
        i++;
        continue;
      }
      break;
    }
    var bodyRes = parseStatementsBlock(lines, i, ["# cmd", "# events", "# prefixes", "# commands"]);
    return {
      command: {
        name: name,
        description: description,
        args: args,
        permissions: permissions,
        body: bodyRes.body
      },
      nextIndex: bodyRes.nextIndex
    };
  }

  function parseArgBlock(lines, index) {
    var header = trimLine(lines[index]);
    var m = header.match(/^arg\("([^"]+)"\s*,\s*"([^"]+)"\):/);
    if (!m) return { arg: null, nextIndex: index + 1 };
    var name = m[1];
    var desc = m[2];
    var type = "text";
    var required = false;
    var i = index + 1;
    while (i < lines.length) {
      var t = trimLine(lines[i]);
      if (isBlank(t)) {
        i++;
        continue;
      }
      var lower = t.toLowerCase();
      if (t.startsWith("arg(") || lower.startsWith("# cmd") || lower === "# events" || lower === "# prefixes" || lower === "# commands" || !t.includes(":")) break;
      var parts = t.split(":");
      var key = parts[0].trim().toLowerCase();
      var value = parts.slice(1).join(":").trim();
      if (key === "type") type = value.replace(/,$/, "").trim();
      else if (key === "required") required = value.replace(/,$/, "").trim().toLowerCase() === "true";
      i++;
    }
    return { arg: { name: name, description: desc, type: type, required: required }, nextIndex: i };
  }

  function parseStatementsBlock(lines, index, stopMarkers) {
    var body = [];
    var i = index;
    while (i < lines.length) {
      var raw = lines[i];
      var t = trimLine(raw);
      if (isBlank(t)) {
        i++;
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
      if (node) body.push(node);
      i++;
    }
    return { body: body, nextIndex: i };
  }

  function parseIfBlock(lines, index, stopMarkers) {
    var header = trimLine(lines[index]);
    var condText = header.slice(3).trim();
    if (condText.endsWith(":")) condText = condText.slice(0, -1).trim();
    var i = index + 1;
    var bodyRes = parseStatementsBlock(lines, i, stopMarkers.concat(["if "]));
    return { node: { kind: "if", condition: condText, body: bodyRes.body }, nextIndex: bodyRes.nextIndex };
  }

  function parseCreateChannelBlock(lines, index) {
    var type = null;
    var title = null;
    var category = null;
    var i = index + 1;
    while (i < lines.length) {
      var t = trimLine(lines[i]);
      if (isBlank(t)) {
        i++;
        continue;
      }
      var lower = t.toLowerCase();
      if (
        lower === "createchannel:" ||
        lower.startsWith("# el") ||
        lower === "# events" ||
        lower === "# prefixes" ||
        lower === "# commands" ||
        lower.startsWith("# pfx") ||
        lower.startsWith("# cmd") ||
        lower.startsWith("if ")
      ) {
        break;
      }
      if (startsWithIgnoreCase(t, "type:")) type = trimLine(t.slice(5));
      else if (startsWithIgnoreCase(t, "title:")) title = trimQuotes(trimLine(t.slice(6)));
      else if (startsWithIgnoreCase(t, "category:")) category = trimQuotes(trimLine(t.slice(9)));
      i++;
    }
    return { node: { kind: "createChannel", channelType: type, title: title, category: category }, nextIndex: i };
  }

  function trimQuotes(s) {
    if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') return s.slice(1, -1);
    return s;
  }

  function parseSimpleActionLine(t) {
    if (t.startsWith("send(")) return parseSend(t);
    if (t.startsWith("reply(")) return parseReply(t);
    if (t.startsWith("dm(")) return parseDm(t);
    if (t.startsWith("react(")) return parseReact(t);
    if (t.startsWith("createCategory(")) return parseCreateCategory(t);
    if (t.startsWith("wait(")) return parseWait(t);
    if (t.startsWith("random(")) return parseRandom(t);
    if (t.startsWith("defer(") || t === "defer()") return { kind: "defer" };
    if (t.startsWith("deleteVar(")) return parseDeleteVar(t);
    if (t.startsWith("kick(")) return parseModeration(t, "kick");
    if (t.startsWith("ban(")) return parseModeration(t, "ban");
    if (t.startsWith("timeout(")) return parseModeration(t, "timeout");
    return { kind: "rawAction", text: t };
  }

  function parseSend(t) {
    var m2 = t.match(/^send\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (m2) return { kind: "send", channel: m2[1], text: m2[2] };
    var m1 = t.match(/^send\("([^"]*)"\)$/);
    if (m1) return { kind: "send", channel: null, text: m1[1] };
    return { kind: "rawAction", text: t };
  }

  function parseReply(t) {
    var m = t.match(/^reply\("([^"]*)"\)$/);
    if (m) return { kind: "reply", text: m[1] };
    return { kind: "rawAction", text: t };
  }

  function parseDm(t) {
    var m = t.match(/^dm\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (m) return { kind: "dm", userId: m[1], text: m[2] };
    return { kind: "rawAction", text: t };
  }

  function parseReact(t) {
    var m = t.match(/^react\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (m) return { kind: "react", messageId: m[1], emoji: m[2] };
    return { kind: "rawAction", text: t };
  }

  function parseCreateCategory(t) {
    var m = t.match(/^createCategory\("([^"]*)"\)$/);
    if (m) return { kind: "createCategory", title: m[1] };
    return { kind: "rawAction", text: t };
  }

  function parseWait(t) {
    var m = t.match(/^wait\("([^"]*)"\)$/);
    if (m) return { kind: "wait", seconds: m[1] };
    return { kind: "rawAction", text: t };
  }

  function parseRandom(t) {
    var m = t.match(/^random\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (m) return { kind: "random", min: m[1], max: m[2] };
    return { kind: "rawAction", text: t };
  }

  function parseDeleteVar(t) {
    var m = t.match(/^deleteVar\("([^"]*)"\)$/);
    if (m) return { kind: "deleteVar", name: m[1] };
    return { kind: "rawAction", text: t };
  }

  function parseModeration(t, kind) {
    // kick("user", "reason")
    // ban("user", "reason")
    // timeout("user", "duration", "reason")
    var mKickBan = t.match(/^(kick|ban)\("([^"]*)"\s*,\s*"([^"]*)"\)$/);
    var mTimeout = t.match(/^timeout\("([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\)$/);
    if (mKickBan && (kind === "kick" || kind === "ban")) {
      return { kind: kind, user: mKickBan[2], reason: mKickBan[3] };
    }
    if (mTimeout && kind === "timeout") {
      return { kind: "timeout", user: mTimeout[1], duration: mTimeout[2], reason: mTimeout[3] };
    }
    return { kind: "rawAction", text: t };
  }

  // ---------- CODEGEN ----------

  function buildHeader() {
    var code = "";
    code += "import asyncio\n";
    code += "import random\n";
    code += "import discord\n";
    code += "from discord.ext import commands\n";
    code += "from discord import app_commands\n";
    code += "from datetime import datetime, timedelta\n\n";
    code += "intents = discord.Intents.all()\n";
    code += 'bot = commands.Bot(command_prefix="!", intents=intents)\n\n';
    code += "def parse_duration(s: str) -> int:\n";
    code += "    s = s.strip().lower()\n";
    code += "    if not s:\n";
    code += "        return 0\n";
    code += "    num = ''.join(ch for ch in s if ch.isdigit())\n";
    code += "    unit = ''.join(ch for ch in s if not ch.isdigit()) or 's'\n";
    code += "    try:\n";
    code += "        n = int(num)\n";
    code += "    except ValueError:\n";
    code += "        return 0\n";
    code += "    if unit == 's':\n";
    code += "        return n\n";
    code += "    if unit == 'm':\n";
    code += "        return n * 60\n";
    code += "    if unit == 'h':\n";
    code += "        return n * 3600\n";
    code += "    if unit == 'd':\n";
    code += "        return n * 86400\n";
    code += "    return n\n\n";
    return code;
  }

  function generate(ast) {
    var code = "";
    code += generateEventsAndPrefixes(ast.events, ast.prefixes);
    code += generateSlashCommands(ast.commands);
    return code;
  }

  // unified on_message
  function generateEventsAndPrefixes(events, prefixes) {
    var code = "";
    var readyBodies = [];
    var interactionBodies = [];
    var messageBodies = [];

    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev.type === "on_ready") readyBodies = readyBodies.concat(ev.body);
      else if (ev.type === "on_interaction") interactionBodies = interactionBodies.concat(ev.body);
      else if (ev.type === "on_message") messageBodies = messageBodies.concat(ev.body);
    }

    // on_ready
    code += "@bot.event\n";
    code += "async def on_ready():\n";
    if (!readyBodies.length) {
      code += '    print(f"Logged in as {bot.user} (ID: {bot.user.id})")\n';
      code += '    print("------")\n\n';
    } else {
      for (var r = 0; r < readyBodies.length; r++) {
        code += generateStatement(readyBodies[r], "ready", "    ", true);
      }
      code += "\n";
    }

    // on_interaction
    code += "@bot.event\n";
    code += "async def on_interaction(interaction):\n";
    if (!interactionBodies.length) {
      code += "    await bot.process_application_commands(interaction)\n\n";
    } else {
      for (var x = 0; x < interactionBodies.length; x++) {
        code += generateStatement(interactionBodies[x], "interaction", "    ", true);
      }
      code += "    await bot.process_application_commands(interaction)\n\n";
    }

    // PREFIX SYSTEM + on_message
    var hasPrefixes = prefixes.prefixChar && prefixes.commands.length > 0;
    var hasOnMessageEvents = messageBodies.length > 0;

    if (hasPrefixes) {
      code += "PREFIX = " + JSON.stringify(prefixes.prefixChar) + "\n\n";
    }

    code += "@bot.event\n";
    code += "async def on_message(message):\n";

    if (hasPrefixes || hasOnMessageEvents) {
      code += "    if message.author.bot:\n";
      code += "        return\n";
    }

    // event on_message bodies
    for (var m = 0; m < messageBodies.length; m++) {
      code += generateStatement(messageBodies[m], "message", "    ", true);
    }

    // prefix handling
    if (hasPrefixes) {
      code += "    content = message.content\n";
      code += "    if content.startswith(PREFIX):\n";
      code += "        without_prefix = content[len(PREFIX):]\n";
      code += "        parts = without_prefix.split()\n";
      code += "        if parts:\n";
      code += "            cmd_name = parts[0]\n";
      code += "            args = parts[1:]\n";

      for (var p = 0; p < prefixes.commands.length; p++) {
        var pc = prefixes.commands[p];
        code += "            if cmd_name == " + JSON.stringify(pc.name) + ":\n";
        var maxIndex = 0;
        for (var f = 0; f < pc.fields.length; f++) {
          var idx = parseInt(pc.fields[f].index, 10);
          if (idx > maxIndex) maxIndex = idx;
        }
        if (maxIndex > 0) {
          code += "                if len(args) < " + maxIndex + ":\n";
          code += "                    fmt = PREFIX + cmd_name";
          for (var f2 = 0; f2 < pc.fields.length; f2++) {
            code += " + ' ' + " + JSON.stringify(pc.fields[f2].label);
          }
          code += "\n";
          code += "                    await message.channel.send('Format should be: ' + fmt)\n";
          code += "                    return\n";
          for (var f3 = 0; f3 < pc.fields.length; f3++) {
            var idx2 = parseInt(pc.fields[f3].index, 10) - 1;
            var varName = "field_" + pc.fields[f3].label.replace(/[^a-zA-Z0-9_]/g, "_");
            code += "                " + varName + " = args[" + idx2 + "]\n";
          }
        }
        for (var b = 0; b < pc.body.length; b++) {
          code += generateStatement(pc.body[b], "prefix", "                ", true);
        }
        code += "                return\n";
      }
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
        if (cmd.body[b].kind === "send" || cmd.body[b].kind === "reply") firstResp = false;
      }
      code += "\n";
    }
    return code;
  }

  function safeName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  // ---------- STATEMENT CODEGEN ----------

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
    if (node.kind === "send") return generateSend(node, context, indent, firstResponse);
    if (node.kind === "reply") return generateReply(node, context, indent, firstResponse);
    if (node.kind === "dm") return generateDm(node, context, indent);
    if (node.kind === "react") return generateReact(node, context, indent);
    if (node.kind === "createCategory") return generateCreateCategory(node, context, indent);
    if (node.kind === "createChannel") return generateCreateChannel(node, context, indent);
    if (node.kind === "wait") return indent + "await asyncio.sleep(" + safeNumber(node.seconds) + ")\n";
    if (node.kind === "random") return indent + "rand_value = random.randint(" + safeNumber(node.min) + ", " + safeNumber(node.max) + ")\n";
    if (node.kind === "defer") {
      if (context === "slash") return indent + "await interaction.response.defer()\n";
      return indent + "pass\n";
    }
    if (node.kind === "deleteVar") return indent + "# deleteVar not implemented\n";
    if (node.kind === "kick" || node.kind === "ban" || node.kind === "timeout") {
      return generateModeration(node, context, indent);
    }
    if (node.kind === "rawAction") return indent + "# " + node.text + "\n";
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
      // keep as is
    } else if (value) {
      value = JSON.stringify(value);
    }

    if (op === "contains") return value + " in " + pyTarget;
    if (op === "startswith") return pyTarget + ".startswith(" + value + ")";
    if (op === "endswith") return pyTarget + ".endswith(" + value + ")";
    if (op === "greater") return "float(" + pyTarget + ") > float(" + (value || "0") + ")";
    if (op === "less") return "float(" + pyTarget + ") < float(" + (value || "0") + ")";
    if (op === "is") return pyTarget + " == " + value;
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

  // simple variable replacement for arg() and fields
  function replaceVarsInText(text, context) {
    // context: { kind: "slash"|"prefix"|"message", args: [...], fields: {...} }
    var out = text;

    // {arg('name')}
    out = out.replace(/\{arg\('([^']+)'\)\}/g, function (_, name) {
      return "${" + safeName(name) + "}";
    });

    // {f@user} / {freason}
    out = out.replace(/\{f@([^}]+)\}/g, function (_, label) {
      return "${field_" + label.replace(/[^a-zA-Z0-9_]/g, "_") + "}";
    });
    out = out.replace(/\{f([^}]+)\}/g, function (_, label) {
      return "${field_" + label.replace(/[^a-zA-Z0-9_]/g, "_") + "}";
    });

    // basic user/message vars could be added here later

    return out;
  }

  function toFStringLiteral(text) {
    // convert "Hello ${name}" to f"Hello {name}"
    var escaped = escapePyString(text);
    return "f\"" + escaped.replace(/\$\{([^}]+)\}/g, "{\$1}") + "\"";
  }

  function generateSend(node, context, indent, firstResponse) {
    var txt = replaceVarsInText(node.text, null);
    var pyStr = toFStringLiteral(txt);
    if (context === "message" || context === "prefix") {
      if (node.channel === null) return indent + "await message.channel.send(" + pyStr + ")\n";
      return (
        indent + 'channel = bot.get_channel(int("' + escapePyString(node.channel) + '"))\n' +
        indent + "if channel is not None:\n" +
        indent + "    await channel.send(" + pyStr + ")\n"
      );
    }
    if (context === "ready") return indent + "# send not supported in on_ready without explicit channel\n";
    if (context === "slash") {
      if (firstResponse) return indent + "await interaction.response.send_message(" + pyStr + ")\n";
      return indent + "await interaction.followup.send(" + pyStr + ")\n";
    }
    return indent + "pass\n";
  }

  function generateReply(node, context, indent, firstResponse) {
    var txt = replaceVarsInText(node.text, null);
    var pyStr = toFStringLiteral(txt);
    if (context === "message" || context === "prefix") return indent + "await message.reply(" + pyStr + ")\n";
    if (context === "slash") {
      if (firstResponse) return indent + "await interaction.response.send_message(" + pyStr + ")\n";
      return indent + "await interaction.followup.send(" + pyStr + ")\n";
    }
    return indent + "pass\n";
  }

  function generateDm(node, context, indent) {
    var txt = replaceVarsInText(node.text, null);
    var pyStr = toFStringLiteral(txt);
    return (
      indent + 'user = bot.get_user(int("' + escapePyString(node.userId) + '"))\n' +
      indent + "if user is not None:\n" +
      indent + "    await user.send(" + pyStr + ")\n"
    );
  }

  function generateReact(node, context, indent) {
    if (context === "message" || context === "prefix") {
      return (
        indent + 'target = await message.channel.fetch_message(int("' + escapePyString(node.messageId) + '"))\n' +
        indent + 'await target.add_reaction("' + escapePyString(node.emoji) + '")\n'
      );
    }
    return indent + "pass\n";
  }

  function generateCreateCategory(node, context, indent) {
    var title = replaceVarsInText(node.title || "New Category", null);
    var pyStr = toFStringLiteral(title);
    if (context === "message" || context === "prefix") {
      return indent + "if message.guild is not None:\n" + indent + "    await message.guild.create_category(" + pyStr + ")\n";
    }
    if (context === "ready") {
      return indent + "for guild in bot.guilds:\n" + indent + "    await guild.create_category(" + pyStr + ")\n";
    }
    return indent + "pass\n";
  }

  function generateCreateChannel(node, context, indent) {
    var title = replaceVarsInText(node.title || "new-channel", null);
    var pyTitle = toFStringLiteral(title);
    var categoryName = node.category ? replaceVarsInText(node.category, null) : null;
    var pyCat = categoryName ? toFStringLiteral(categoryName) : null;

    if (context === "message" || context === "prefix") {
      var code = "";
      code += indent + "guild = message.guild\n";
      code += indent + "if guild is not None:\n";
      if (pyCat) {
        code += indent + "    category = discord.utils.get(guild.categories, name=" + pyCat + ")\n";
        code += indent + "    if category is None:\n";
        code += indent + "        category = await guild.create_category(" + pyCat + ")\n";
        code += indent + "    await guild.create_text_channel(" + pyTitle + ", category=category)\n";
      } else {
        code += indent + "    await guild.create_text_channel(" + pyTitle + ")\n";
      }
      return code;
    }

    if (context === "ready") {
      var code2 = "";
      code2 += indent + "for guild in bot.guilds:\n";
      if (pyCat) {
        code2 += indent + "    category = discord.utils.get(guild.categories, name=" + pyCat + ")\n";
        code2 += indent + "    if category is None:\n";
        code2 += indent + "        category = await guild.create_category(" + pyCat + ")\n";
        code2 += indent + "    await guild.create_text_channel(" + pyTitle + ", category=category)\n";
      } else {
        code2 += indent + "    await guild.create_text_channel(" + pyTitle + ")\n";
      }
      return code2;
    }

    return indent + "pass\n";
  }

  function generateModeration(node, context, indent) {
    // expects user string already an ID or something you control
    var userExpr = toFStringLiteral(node.user || "");
    var reasonExpr = node.reason ? toFStringLiteral(node.reason) : '"No reason provided"';

    if (context === "slash") {
      // in slash, user is usually an arg already, so we just trust it
      if (node.kind === "kick") {
        return (
          indent + "member = interaction.guild.get_member(int(" + userExpr + "))\n" +
          indent + "if member:\n" +
          indent + "    await member.kick(reason=" + reasonExpr + ")\n"
        );
      }
      if (node.kind === "ban") {
        return (
          indent + "member = interaction.guild.get_member(int(" + userExpr + "))\n" +
          indent + "if member:\n" +
          indent + "    await member.ban(reason=" + reasonExpr + ")\n"
        );
      }
      if (node.kind === "timeout") {
        var durExpr = toFStringLiteral(node.duration || "0s");
        return (
          indent + "seconds = parse_duration(" + durExpr + ")\n" +
          indent + "member = interaction.guild.get_member(int(" + userExpr + "))\n" +
          indent + "if member:\n" +
          indent + "    until = datetime.utcnow() + timedelta(seconds=seconds)\n" +
          indent + "    await member.edit(timed_out_until=until, reason=" + reasonExpr + ")\n"
        );
      }
    } else {
      // message/prefix
      if (node.kind === "kick") {
        return (
          indent + "if message.guild is not None:\n" +
          indent + "    member = message.guild.get_member(int(" + userExpr + "))\n" +
          indent + "    if member:\n" +
          indent + "        await member.kick(reason=" + reasonExpr + ")\n"
        );
      }
      if (node.kind === "ban") {
        return (
          indent + "if message.guild is not None:\n" +
          indent + "    member = message.guild.get_member(int(" + userExpr + "))\n" +
          indent + "    if member:\n" +
          indent + "        await member.ban(reason=" + reasonExpr + ")\n"
        );
      }
      if (node.kind === "timeout") {
        var durExpr2 = toFStringLiteral(node.duration || "0s");
        return (
          indent + "if message.guild is not None:\n" +
          indent + "    seconds = parse_duration(" + durExpr2 + ")\n" +
          indent + "    member = message.guild.get_member(int(" + userExpr + "))\n" +
          indent + "    if member:\n" +
          indent + "        until = datetime.utcnow() + timedelta(seconds=seconds)\n" +
          indent + "        await member.edit(timed_out_until=until, reason=" + reasonExpr + ")\n"
        );
      }
    }

    return indent + "# moderation action not applied\n";
  }

  // ---------- RUNNER ----------

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
