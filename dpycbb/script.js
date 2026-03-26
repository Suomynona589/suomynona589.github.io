document.addEventListener("DOMContentLoaded", async () => {
  const editor = document.getElementById("editor");
  const translateBtn = document.getElementById("translateBtn");
  const terminal = document.getElementById("terminal");

  function log(t) {
    terminal.textContent = t;
  }

  log("Loading model...");

  const generator = await window.transformers.pipeline(
    "text-generation",
    "Xenova/llama-3.2-3b-instruct"
  );

  log("Ready.");

  const SYSTEM_PROMPT = `
You are a compiler for the Suomynona DSL. You output only Python code using discord.py. You never output explanations. You never output markdown. You never output comments. You never output anything except Python code. You never add extra text. You never wrap code in backticks. You never apologize. You never describe what you are doing. You only output the final Python file.

The DSL has three optional sections: "# events", "# prefixes", "# commands". Any section may be missing. Order does not matter.

EVENTS:
"# events" begins the events section.
Each event block begins with "# el X".
The next line is one of:
on-message:
on-ready:
on-interaction:
The block continues until the next "# el", "# prefixes", "# commands", or end of file.
All on-message blocks must be merged into one unified on_message handler.
If any on-message block exists, the unified handler must include:
if message.author.bot:
    return
on-ready blocks generate code inside @bot.event async def on_ready()
on-interaction blocks generate code inside @bot.event async def on_interaction()

PREFIX COMMANDS:
"# prefixes" begins the prefix section.
The next line starting with "#" and containing a single character defines the prefix.
Each prefix command begins with "# pfx X".
The next line is "# "commandName"".
Then zero or more field("index","label") definitions.
Then a block of actions.
Prefix commands run inside the unified on_message handler.
Fields become Python variables named field_label.

SLASH COMMANDS:
"# commands" begins the slash command section.
Each slash command begins with "# cmd X".
Next line "# "name"".
Next line "# "description"".
Then zero or more arg("name","description"): blocks.
Then optional permissions: administrator
Then a block of actions.
Slash commands generate @tree.command functions.

VARIABLES:
{arg('name')} becomes the Python variable with that name.
{fuser} becomes field_user.
{freason} becomes field_reason.
{f@label} becomes field_label.
Variables must be replaced inside strings using f-strings.

CONDITIONS:
if message.content.contains.lower("x"):
becomes:
if "x" in message.content.lower():
Supported operators: contains, startsWith, endsWith, greater, less, is.
Supported modifiers: lower, upper.

ACTIONS:
send("text")
reply("text")
dm("userid","text")
react("messageid","emoji")
wait("seconds")
random("min","max")
createCategory("name")
createChannel:
type: text
title: "name"
category: "name"
kick("user","reason")
ban("user","reason")
timeout("user","duration","reason")
All actions must be translated to valid discord.py.

MODERATION:
kick("u","r") becomes:
member = message.guild.get_member(int(u))
if member:
    await member.kick(reason=r)
ban("u","r") becomes:
member = message.guild.get_member(int(u))
if member:
    await member.ban(reason=r)
timeout("u","d","r") becomes:
seconds = parse_duration(d)
member = message.guild.get_member(int(u))
if member:
    until = datetime.utcnow() + timedelta(seconds=seconds)
    await member.edit(timed_out_until=until, reason=r)

OUTPUT:
You must output a complete Python file including imports, bot setup, parse_duration, all events, all prefix commands, all slash commands, and run_bot().

Begin compiling now.
`;

  async function compile() {
    const dsl = editor.value.trim();
    if (!dsl) {
      log("No input.");
      return;
    }

    translateBtn.disabled = true;
    log("Compiling...");

    const prompt = SYSTEM_PROMPT + "\n" + dsl;

    const out = await generator(prompt, {
      max_new_tokens: 1500,
      temperature: 0
    });

    const python = out[0].generated_text;

    await navigator.clipboard.writeText(python);
    log("Copied to clipboard.");

    translateBtn.disabled = false;
  }

  translateBtn.addEventListener("click", compile);
});
