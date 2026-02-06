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
