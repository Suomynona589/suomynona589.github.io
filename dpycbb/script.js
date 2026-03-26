document.addEventListener("DOMContentLoaded", function () {
  var tokenInput = document.getElementById("tokenInput");
  var editor = document.getElementById("editor");
  var translateBtn = document.getElementById("translateBtn");
  var terminal = document.getElementById("terminal");

  var savedToken = localStorage.getItem("botToken") || "";
  tokenInput.value = savedToken;

  tokenInput.addEventListener("input", function () {
    localStorage.setItem("botToken", tokenInput.value);
  });

  function logToTerminal(text) {
    terminal.textContent += text + "\n";
    terminal.scrollTop = terminal.scrollHeight;
  }

  function translateSource(source) {
    var lines = source.split("\n");
    var indented = lines.map(function (l) {
      return "    " + l;
    }).join("\n");
    var result = "";
    result += "async def main_bot_logic(bot, message, interaction):\n";
    if (source.trim() === "") {
      result += "    pass\n";
    } else {
      result += '    """\n';
      result += "    Original main.bot script:\n\n";
      result += indented + "\n";
      result += '    """\n';
    }
    return result + "\n";
  }

  async function handleTranslate() {
    terminal.textContent = "";
    var token = tokenInput.value.trim();
    var source = editor.value;

    if (!token) {
      logToTerminal("No token provided.");
      return;
    }

    if (!source.trim()) {
      logToTerminal("No script provided.");
      return;
    }

    var pythonCode = "";
    pythonCode += "import asyncio\n";
    pythonCode += "import discord\n";
    pythonCode += "from discord.ext import commands\n\n";
    pythonCode += "intents = discord.Intents.all()\n";
    pythonCode += 'bot = commands.Bot(command_prefix="!", intents=intents)\n\n';
    pythonCode += translateSource(source);
    pythonCode += "\n";
    pythonCode += "@bot.event\n";
    pythonCode += "async def on_ready():\n";
    pythonCode += '    print(f"Logged in as {bot.user} (ID: {bot.user.id})")\n';
    pythonCode += "    print(\"------\")\n\n";
    pythonCode += "@bot.event\n";
    pythonCode += "async def on_message(message):\n";
    pythonCode += "    if message.author.bot:\n";
    pythonCode += "        return\n";
    pythonCode += "    await main_bot_logic(bot, message, None)\n\n";
    pythonCode += "@bot.event\n";
    pythonCode += "async def on_interaction(interaction):\n";
    pythonCode += "    await main_bot_logic(bot, None, interaction)\n\n";
    pythonCode += "def run_bot():\n";
    pythonCode += '    bot.run("' + token.replace(/"/g, '\\"') + '")\n\n';
    pythonCode += "if __name__ == \"__main__\":\n";
    pythonCode += "    run_bot()\n";

    try {
      await navigator.clipboard.writeText(pythonCode);
      logToTerminal("Translation complete. Python code copied to clipboard.");
    } catch (e) {
      logToTerminal("Failed to copy to clipboard.");
    }
  }

  translateBtn.addEventListener("click", handleTranslate);
});
