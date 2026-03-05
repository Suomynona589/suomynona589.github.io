// =========================
// LocalStorage helpers
// =========================

function loadRecipes() {
    const saved = localStorage.getItem("recipes");
    return saved ? JSON.parse(saved) : {};
}

function saveRecipes(recipes) {
    localStorage.setItem("recipes", JSON.stringify(recipes, null, 2));
}

// =========================
// Build safe proxy URL
// =========================

function buildURL(item) {
    const safeItem = encodeURIComponent(item);
    const target = `https://infinibrowser.wiki/api/recipe?id=${safeItem}`;
    return "https://corsproxy.io/?" + encodeURIComponent(target);
}

// =========================
// Fetch raw recipe text
// =========================

async function fetchRecipes(item) {
    const url = buildURL(item);

    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const raw = await res.text();
    return JSON.parse(raw);
}

// =========================
// Fetch button logic
// =========================

document.getElementById("fetchBtn").onclick = async () => {
    const item = document.getElementById("itemInput").value.trim();
    const status = document.getElementById("status");

    if (!item) {
        status.textContent = "Enter something first.";
        return;
    }

    status.textContent = "Fetching...";

    try {
        const data = await fetchRecipes(item);
        const steps = data.steps || [];

        let recipes = loadRecipes();
        let added = 0;
        let addedList = [];

        steps.forEach(step => {
            const key = `${step.a.id}+${step.b.id}`;
            if (!recipes[key]) {
                recipes[key] = {
                    emoji: step.result.emoji,
                    text: step.result.id
                };
                added++;
                addedList.push(`${step.result.emoji} ${step.result.id}`);
            }
        });

        saveRecipes(recipes);

        if (added === 0) {
            status.textContent = "Done. No new recipes were added.";
        } else {
            status.textContent =
                `Done. Added ${added} new recipe(s):\n` +
                addedList.join("\n");
        }

    } catch (err) {
        status.textContent = "Error: " + err.message;
        console.error(err);
    }
};

// =========================
// Copy button
// =========================

document.getElementById("copyBtn").onclick = () => {
    const recipes = localStorage.getItem("recipes") || "{}";
    navigator.clipboard.writeText(recipes);
    alert("Copied recipes to clipboard!");
};

// =========================
// Live recipe counter (bottom right)
// =========================

// Count how many times `"emoji"` appears in the JSON string
function countRecipesByEmoji() {
    const raw = localStorage.getItem("recipes") || "";
    return (raw.match(/"emoji"/g) || []).length;
}

function updateCounter() {
    const count = countRecipesByEmoji();
    document.getElementById("counterBox").textContent = `Recipe Count: ${count}`;
}

setInterval(updateCounter, 300);
updateCounter();
