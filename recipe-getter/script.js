// Load existing recipes or create empty object
function loadRecipes() {
    const saved = localStorage.getItem("recipes");
    return saved ? JSON.parse(saved) : {};
}

// Save updated recipes
function saveRecipes(recipes) {
    localStorage.setItem("recipes", JSON.stringify(recipes, null, 2));
}

async function fetchRecipes(item) {
    const url = `https://infinibrowser.wiki/api/recipe?id=${encodeURIComponent(item)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    return res.json();
}

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

        steps.forEach(step => {
            const key = `${step.a.id}+${step.b.id}`;
            if (!recipes[key]) {
                recipes[key] = {
                    emoji: step.result.emoji,
                    text: step.result.id
                };
                added++;
            }
        });

        saveRecipes(recipes);

        status.textContent = `Done. Added ${added} new recipe(s).`;
    } catch (err) {
        status.textContent = "Error fetching recipe.";
    }
};

document.getElementById("copyBtn").onclick = () => {
    const recipes = localStorage.getItem("recipes") || "{}";
    navigator.clipboard.writeText(recipes);
};
