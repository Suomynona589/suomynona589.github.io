document.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById("editor");
  const translateBtn = document.getElementById("translateBtn");
  const terminal = document.getElementById("terminal");
  const modelInput = document.getElementById("modelInput");
  const hostInput = document.getElementById("hostInput");

  function log(t) {
    terminal.textContent = t;
  }

  const SYSTEM_PROMPT = `
You are a deterministic compiler that converts the Suomynona DSL into a single, runnable Python file using discord.py. Output only valid Python source code. Do not output any explanations, comments, markdown, or extra text. The output must be a complete Python program including imports, bot setup, a parse_duration helper, event handlers, prefix handling, slash command registration, and a run_bot() call. The DSL has three optional sections: "# events", "# prefixes", "# commands". Sections may be missing and may appear in any order. Indentation in the DSL is not strict; blocks are defined by keywords. Preserve the user's intent exactly.

Language rules:
- "# events" begins the events section. Event blocks start with "# el" followed by an identifier. The next non-empty line is one of: on-message:, on-ready:, on-interaction:. The block continues until the next "# el", "# prefixes", "# commands", or EOF. Merge all on-message blocks into one unified on_message handler. If any on-message block exists, the unified handler must include: if message.author.bot: return
- on-ready blocks generate code inside @bot.event async def on_ready()
- on-interaction blocks generate code inside @bot.event async def on_interaction()

Prefix rules:
- "# prefixes" begins the prefix section. The first non-empty line after it that starts with "#" and contains a single character defines the prefix character. Each prefix command begins with "# pfx" and an identifier. The next line is "# "commandName"". Then zero or more field("index","label") definitions. Fields map to positional arguments when the command is invoked and become Python variables named field_label where non-alphanumeric characters are replaced with underscores. Prefix commands run inside the unified on_message handler. If a prefix command declares N fields, require at least N positional arguments; otherwise send a usage message showing the prefix and field labels.

Slash command rules:
- "# commands" begins the slash command section. Each slash command begins with "# cmd" and an identifier. The next two lines are "# "name"" and "# "description"". Then zero or more arg("name","description"): blocks with optional type and required properties. Then optional permissions: administrator. Then a block of actions. Slash commands generate @tree.command functions. Arguments declared in arg() become function parameters with the same name.

Variables and replacements:
- {arg('name')} maps to the slash command argument variable name.
- {fuser} maps to field_user.
- {freason} maps to field_reason.
- {f@label} maps to field_label.
- {user.id}, {user.mention}, {message.content} map to the corresponding Python attributes.
- Replace variables inside strings using Python f-strings. When translating a DSL string that contains variables, produce an f-string that references the correct Python variables.

Conditions:
- message.content.contains.lower("x") -> "x" in message.content.lower()
- message.content.startsWith("x") -> message.content.startswith("x")
- message.content.endsWith("x") -> message.content.endswith("x")
- message.content.greater("10") -> float(message.content) > 10
- message.content.less("5") -> float(message.content) < 5
- message.content.is("value") -> message.content == "value"
- Support .lower and .upper modifiers applied to message.content before the operator.

Actions:
- send("text") sends to the current channel in on_message/prefix contexts; in slash context, the first send/reply must use interaction.response.send_message and subsequent sends use interaction.followup.send.
- reply("text") replies to the message or responds to the interaction.
- dm("userid","text") sends a DM to the user id (assume numeric id or variable that resolves to numeric id).
- react("messageid","emoji") fetches the message by id and adds the reaction.
- wait("seconds") uses asyncio.sleep with numeric seconds.
- random("min","max") sets a variable rand_value = random.randint(min,max).
- createCategory("name") creates a category in the guild context.
- createChannel: block with type, title, category creates a text channel under the category if provided.
- kick("user","reason") expects the user argument to be a numeric id or a variable that resolves to numeric id. Translate to member = guild.get_member(int(user)); if member: await member.kick(reason=reason)
- ban("user","reason") similar to kick but await member.ban(reason=reason)
- timeout("user","duration","reason") parse duration strings like 10s, 5m, 1h, 2d into seconds using parse_duration, compute until = datetime.utcnow() + timedelta(seconds=seconds), then await member.edit(timed_out_until=until, reason=reason)

Parsing and safety:
- If a DSL expression cannot be parsed into a known construct, translate it into a Python comment line that begins with "# " followed by the original DSL line. However, do not output any comments in the final file unless the DSL explicitly contains a "raw" or "comment" action; prefer to output a safe no-op instead. When in doubt, output a no-op that preserves program validity.
- Do not attempt to auto-extract IDs from mention strings. Assume the DSL provides clean numeric IDs when required.
- The generated Python must import asyncio, random, discord, from discord.ext import commands, from discord import app_commands, and from datetime import datetime, timedelta. It must define intents = discord.Intents.all() and bot = commands.Bot(command_prefix="!", intents=intents).
- Include a parse_duration(s: str) -> int helper that supports s like "10s","5m","1h","2d".
- Register slash commands on bot.tree and call bot.run(token) inside run_bot().

Output requirements:
- Output only Python source code. No comments, no extra text, no markdown. The file must be syntactically valid Python 3.11+ and runnable with discord.py that supports timed_out_until member.edit.
- Use deterministic, minimal, readable formatting.
- Begin output now and produce the complete Python file for the DSL provided after this prompt.
`;

  async function compile() {
    const dsl = editor.value.trim();
    if (!dsl) {
      log("No input.");
      return;
    }
    translateBtn.disabled = true;
    log("Sending to Ollama...");
    const host = hostInput.value.trim() || "http://localhost:11434";
    const model = modelInput.value.trim() || "llama3";
    const body = {
      model: model,
      prompt: SYSTEM_PROMPT + "\n" + dsl,
      max_tokens: 2000,
      temperature: 0
    };
    try {
      const res = await fetch(host + "/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const text = await res.text();
        log("Ollama error: " + res.status + " " + text);
        translateBtn.disabled = false;
        return;
      }
      const data = await res.json();
      let python = "";
      if (data && data.choices && data.choices.length) {
        const choice = data.choices[0];
        if (choice.content && Array.isArray(choice.content)) {
          for (const c of choice.content) {
            if (c.type === "output_text" && c.text) {
              python += c.text;
            } else if (c.type === "message" && c.text) {
              python += c.text;
            }
          }
        } else if (choice.message && choice.message.content) {
          python = choice.message.content;
        } else if (choice.text) {
          python = choice.text;
        }
      } else if (data && data.output) {
        python = data.output;
      } else {
        python = JSON.stringify(data);
      }
      await navigator.clipboard.writeText(python);
      log("Compiled and copied to clipboard.");
    } catch (err) {
      log("Request failed: " + err.message);
    } finally {
      translateBtn.disabled = false;
    }
  }

  translateBtn.addEventListener("click", compile);
});
