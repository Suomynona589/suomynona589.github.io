const shimmerCSS = `
.tiny-shimmer {
  font-size: 100px;
  font-weight: bold;
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
style.textContent = shimmerCSS;
document.head.appendChild(style);

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
  const root = document.querySelector(selector);
  if (!root) return;
  const textElements = root.querySelectorAll(
    "p, span, a, button, h1, h2, h3, h4, h5, h6, div, li, label, strong, em, b, i, u, mark, small, sub, sup"
  );
  textElements.forEach(el => el.classList.add("tiny-shimmer"));
}
