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
// Normal fetch mode
// =========================

async function handleSingleFetch(item, status) {
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
}

// =========================
// Number_Spam mode
// =========================

async function handleNumberSpam(status) {
    status.textContent = "Starting Number_Spam (0–999)...";

    let recipes = loadRecipes();
    let totalAdded = 0;
    let addedList = [];

    const CONCURRENCY = 75; // 50 fetches at once
    const MAX = 9999;        // change to 9999 or 99999 if you want

    let current = 0;

    async function worker() {
        while (current <= MAX) {
            const i = current++;
            try {
                const data = await fetchRecipes(i);
                const steps = data.steps || [];

                steps.forEach(step => {
                    const key = `${step.a.id}+${step.b.id}`;
                    if (!recipes[key]) {
                        recipes[key] = {
                            emoji: step.result.emoji,
                            text: step.result.id
                        };
                        totalAdded++;
                        addedList.push(`${step.result.emoji} ${step.result.id}`);
                    }
                });

                saveRecipes(recipes);
            } catch (err) {
                console.error("Error on number", i, err);
            }
        }
    }

    // Start 50 workers in parallel
    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) {
        workers.push(worker());
    }

    // Wait for all workers to finish
    await Promise.all(workers);

    if (totalAdded === 0) {
        status.textContent = "Done. No new recipes were added.";
    } else {
        status.textContent =
            `Done. Added ${totalAdded} new recipe(s):\n` +
            addedList.join("\n");
    }
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

    if (item === "Number_Spam") {
        handleNumberSpam(status);
        return;
    }

    status.textContent = "Fetching...";
    try {
        await handleSingleFetch(item, status);
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
