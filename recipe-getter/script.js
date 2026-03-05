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
    return encodeURIComponent(target);
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
// Number_Spam with custom concurrency, max, and start
// Format: N_SC:50M:9999S:500
// =========================

async function handleNumberSpam(input, status) {
    // Parse format: N_SC:<C>M:<MAX>S:<START>
    const match = input.match(/^N_SC:(\d+)M:(\d+)S:(\d+)$/);

    if (!match) {
        status.textContent = "Invalid N_SC format.";
        return;
    }

    const CONCURRENCY = parseInt(match[1]); // how many fetches at once
    const MAX = parseInt(match[2]);         // max number to fetch
    const START = parseInt(match[3]);       // starting number

    status.textContent = `Starting N_SC from ${START} to ${MAX} with concurrency ${CONCURRENCY}...`;

    let recipes = loadRecipes();
    let totalAdded = 0;
    let addedList = [];

    let current = START;

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

    // Start N workers in parallel
    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) {
        workers.push(worker());
    }

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

    // Detect N_SC format
    if (item.startsWith("N_SC:")) {
        handleNumberSpam(item, status);
        return;
    }

    // Normal mode
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
