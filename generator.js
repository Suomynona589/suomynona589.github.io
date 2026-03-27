(function () {
    const PREFIX = "LemonCube's Kite Command Share";
    const API = "https://rapid-boat-67a1.suomynona589.workers.dev/create";

    async function uploadPayload(json) {
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: json
            });

            if (!res.ok) throw new Error(await res.text());
            const { id } = await res.json();
            return id;
        } catch (e) {
            console.error(PREFIX + ": Upload failed:", e);
            alert("Error uploading JSON. Check console.");
            return null;
        }
    }

    function copy(text) {
        navigator.clipboard.writeText(text)
            .then(() => alert("Copied ID to clipboard: " + text))
            .catch(() => {
                console.warn(PREFIX + ": Clipboard failed. ID:", text);
                alert("Clipboard error. ID printed in console.");
                console.log(text);
            });
    }

    if (typeof window.fetch === "function") {
        const originalFetch = window.fetch;

        window.fetch = async function (url, options) {
            if (options?.method?.toUpperCase() === "PATCH" && options.body) {
                console.log(PREFIX + ": Intercepted PATCH");

                const id = await uploadPayload(options.body);
                if (id) copy(id);
            }
            return originalFetch(url, options);
        };

        console.log("\n--- " + PREFIX + " ---\n");
        alert(PREFIX + " active! Click Save Changes to generate a 6‑char share ID.");
    } else {
        alert("Error: fetch unavailable.");
    }
})();
