// --- CONFIG ---
const requiredChars = window.__required || "";
const finalSolution = window.__secret || "";

// --- HELPERS ---
function normalize(str) {
  return str.replace(/\s+/g, "").toUpperCase();
}

function sortString(str) {
  return normalize(str).split("").sort().join("");
}

// --- CHECK #1: ANY ORDER ---
function checkAnyOrder() {
  const user = document.getElementById("anyOrder").value;
  const result = document.getElementById("result1");

  if (sortString(user) === sortString(requiredChars)) {
    result.textContent = "✔ Correct set of characters!";
  } else {
    result.textContent = "❌ Incorrect. Missing or extra characters.";
  }
}

// --- CHECK #2: FINAL UNSCRAMBLED ANSWER ---
function checkFinal() {
  const user = normalize(document.getElementById("finalAnswer").value);
  const result = document.getElementById("result2");

  if (user === normalize(finalSolution)) {
    result.textContent = "✔ Correct final answer!";
  } else {
    result.textContent = "❌ Wrong.";
  }
}

// --- BUTTON + ENTER KEY EVENTS ---
document.getElementById("btn1").onclick = checkAnyOrder;
document.getElementById("btn2").onclick = checkFinal;

document.getElementById("anyOrder").addEventListener("keydown", e => {
  if (e.key === "Enter") checkAnyOrder();
});

document.getElementById("finalAnswer").addEventListener("keydown", e => {
  if (e.key === "Enter") checkFinal();
});

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  // Create a MutationObserver to watch for attribute changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName.toLowerCase() === "contenteditable"
      ) {
        const current = body.getAttribute("contenteditable");

        if (current && current.toLowerCase() === "true") {
          body.setAttribute("contenteditable", "false");
          alert("Don't try to edit my page! ~Suomynona589");
        }
      }
    });
  });

  // Start observing the body for attribute changes
  observer.observe(body, {
    attributes: true,
    attributeFilter: ["contenteditable"]
  });

  // Also check immediately on load
  const initial = body.getAttribute("contenteditable");
  if (initial && initial.toLowerCase() === "true") {
    body.setAttribute("contenteditable", "false");
    alert("Don't try to edit my page! ~Suomynona589");
  }
});
