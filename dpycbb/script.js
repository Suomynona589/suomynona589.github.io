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

    var pythonCode = Translator.translate(source, token);

    try {
      await navigator.clipboard.writeText(pythonCode);
      logToTerminal("Translation complete. Python code copied to clipboard.");
    } catch (e) {
      logToTerminal("Failed to copy to clipboard.");
    }
  }

  translateBtn.addEventListener("click", handleTranslate);
});
