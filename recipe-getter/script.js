function loadRecipes() {
    const saved = localStorage.getItem("recipes");
    return saved ? JSON.parse(saved) : {};
}

function saveRecipes(recipes) {
    localStorage.setItem("recipes", JSON.stringify(recipes, null, 2));
}

async function fetchRecipes(item) {
    const api = `https://infinibrowser.wiki/api/recipe?id=${encodeURIComponent(item)}`;

    // CORS bypass
    const url = `https://corsproxy.io/?${encodeURIComponent(api)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("API error " + res.status);
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
        status.textContent = "Error: " + err.message;
        console.error(err);
    }
};

document.getElementById("copyBtn").onclick = () => {
    const recipes = localStorage.getItem("recipes") || "{}";
    navigator.clipboard.writeText(recipes);
    alert("Copied recipes to clipboard!");
};
