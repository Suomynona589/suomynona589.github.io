function tinyRun(code) {
  const run = () => {
    const statements = code.split("))").map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      if (!stmt.startsWith("target--")) continue;
      const [targetPart, actionPart] = stmt.split("||");
      const selector = targetPart.replace("target--", "").trim();
      const action = actionPart.trim();

      if (action === "text.shimmer") applyShimmer(selector);

      if (action.startsWith("text.color--"))
        applyTextColor(selector, action.replace("text.color--", "").trim());

      if (action.startsWith("background.color--"))
        applyBackgroundColor(selector, action.replace("background.color--", "").trim());

      if (action.startsWith("svg.color--"))
        applySvgColor(selector, action.replace("svg.color--", "").trim());
    }
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", run);
  else run();
}

function applyShimmer(selector) {
  const css = `
${selector} {
  background: linear-gradient(90deg, red, orange, yellow, green, blue, purple);
  background-size: 400%;
  -webkit-background-clip: text;
  color: transparent;
  animation: shine 6s linear infinite;
}
@keyframes shine {
  to { background-position: 400% 0; }
}
`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

function applyTextColor(selector, value) {
  const css = `
${selector} {
  color: ${value};
}
`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

function applyBackgroundColor(selector, value) {
  const css = `
${selector} {
  background-color: ${value};
}
`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

function applySvgColor(selector, value) {
  const css = `
${selector} svg {
  fill: ${value};
}
`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

window.addEventListener("error", e => {
  const msg = e.message.trim();
  if (msg.startsWith("target--") && msg.endsWith("))")) {
    tinyRun(msg);
    e.preventDefault();
  }
});
