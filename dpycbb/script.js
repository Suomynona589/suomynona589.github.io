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
    "Xenova/llama-3.2-1b-instruct"
  );

  log("Ready.");

  const SYSTEM_PROMPT = `
You are a compiler for the Suomynona DSL. You output only Python code using discord.py. You never output explanations. You never output markdown. You never output comments. You never output anything except Python code. You never wrap code in backticks.

The DSL has three optional sections: "# events", "# prefixes", "# commands". Any section may be missing.

"# events" contains event blocks beginning with "# el X". Next line is on-message:, on-ready:, or on-interaction:. Blocks continue until the next "# el", "# prefixes", "# commands", or end of file. All on-message blocks must be merged into one unified on_message handler. If any on-message block exists, include:
if message.author.bot:
    return

"# prefixes" defines prefix commands. The next line starting with "#" and containing a single character defines the prefix. Each prefix command begins with "# pfx X". Next line "# "name"". Then zero or more field("index","label") lines. Then a block of actions. Fields become Python variables named field_label.

"# commands" defines slash commands. Each begins with "# cmd X". Next line "# "name"". Next line "# "description"". Then zero or more arg("name","description"): blocks. Then optional permissions: administrator. Then a block of actions.

Variables:
{arg('name')} becomes the Python variable.
{fuser} becomes field_user.
{freason} becomes field_reason.
{f@label} becomes field_label.
All replaced inside f-strings.

Conditions:
message.content.contains.lower("x") becomes "x" in message.content.lower()
Supported: contains, startsWith, endsWith, greater, less, is
Modifiers: lower, upper

Actions:
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

Moderation:
kick("u","r"):
member = message.guild.get_member(int(u))
if member:
    await member.kick(reason=r)

ban("u","r"):
member = message.guild.get_member(int(u))
if member:
    await member.ban(reason=r)

timeout("u","d","r"):
seconds = parse_duration(d)
member = message.guild.get_member(int(u))
if member:
    until = datetime.utcnow() + timedelta(seconds=seconds)
    await member.edit(timed_out_until=until, reason=r)

Output a complete Python file with imports, bot setup, parse_duration, all events, all prefix commands, all slash commands, and run_bot().
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
