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

  function log(text) {
    terminal.textContent = text;
  }

  async function handleTranslate() {
    terminal.textContent = "";

    var token = localStorage.getItem("botToken") || "";
    var source = editor.value;

    if (!token) {
      log("No token provided.");
      return;
    }

    if (!source.trim()) {
      log("No script provided.");
      return;
    }

    translateBtn.disabled = true;

    var ctx = {
      message: null,
      interaction: null
    };

    var pythonCode = Translator.translate(source, token, ctx);

    try {
      await navigator.clipboard.writeText(pythonCode);
      alert("Python code copied to clipboard.");
    } catch (e) {
      log("Failed to copy to clipboard.");
    }

    translateBtn.disabled = false;
  }

  translateBtn.addEventListener("click", handleTranslate);
});
