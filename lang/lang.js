function tinyRun(code) {
  const run = () => {
    const statements = code.split("))").map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      if (!stmt.startsWith("target--")) continue;
      const [targetPart, actionPart] = stmt.split("||");
      const selector = targetPart.replace("target--", "").trim();
      const action = actionPart.trim();

      if (action === "text.shimmer") {
        applyShimmer(selector);
      }

      if (action.startsWith("text.color--")) {
        const value = action.replace("text.color--", "").trim();
        applyTextColor(selector, value);
      }

      if (action.startsWith("background.color--")) {
        const value = action.replace("background.color--", "").trim();
        applyBackgroundColor(selector, value);
      }

      if (action.startsWith("svg.color--")) {
        const value = action.replace("svg.color--", "").trim();
        applySvgColor(selector, value);
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
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
