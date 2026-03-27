(function () {
    const PREFIX = "LemonCube's Kite Command Share";
    const API = "https://rapid-boat-67a1.suomynona589.workers.dev/create/";

    let storedPayload = null;
    let capturedData = { name: null, description: null };
    let isMonitoring = false;

    async function fetchPayload(id) {
        try {
            const res = await fetch(API + id);
            if (!res.ok) throw new Error(await res.text());
            return await res.text();
        } catch (e) {
            console.error(PREFIX + ": Failed to fetch JSON:", e);
            alert("Error fetching JSON. Check console.");
            return null;
        }
    }

    function sendPatchRequest(appId, commandId, name, description) {
        let finalPayload;

        try {
            const parsed = JSON.parse(storedPayload);
            parsed.flow_source.nodes = parsed.flow_source.nodes.map(n => {
                if (n.type === "entry_command") {
                    n.data.name = name;
                    n.data.description = description;
                }
                return n;
            });
            finalPayload = JSON.stringify(parsed);
        } catch (e) {
            console.error(PREFIX + ": JSON modify error:", e);
            alert("Error modifying JSON.");
            return;
        }

        const headers = new Headers({
            "accept": "application/json",
            "Content-Type": "application/json"
        });

        fetch(`${apiBase}/v1/apps/${appId}/commands/${commandId}`, {
            method: "PATCH",
            headers,
            body: finalPayload,
            credentials: "include"
        })
            .then(r => r.json())
            .then(() => {
                alert("Success! Reload to view your imported command.");
            })
            .catch(e => {
                console.error(PREFIX + ": PATCH failed:", e);
                alert("Error patching command.");
            });
    }

    // --- Setup ---
    const urlMatch = window.location.pathname.match(/\/apps\/([^\/]+)/);
    if (!urlMatch) {
        alert("Error: Not on Kite apps page.");
        return;
    }
    const appId = urlMatch[1];

    const host = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;

    let apiBase;
    if (host === "kite.onl" || host === "www.kite.onl") {
        apiBase = "https://api.kite.onl";
    } else {
        apiBase = `${protocol}//${host}${port ? ":" + port : ""}`;
    }

    // --- Prompt for ID ---
    const id = prompt(PREFIX + " activated!\n\nEnter the 6‑character share ID:");
    if (!id) return;

    (async () => {
        storedPayload = await fetchPayload(id);
        if (!storedPayload) return;

        alert("ID loaded! Now create a new command with any name.");
    })();

    const urlIdPattern = new RegExp(`^/apps/${appId}/commands/([^/]+)`);

    function checkAndPatch() {
        const match = window.location.pathname.match(urlIdPattern);
        if (match && capturedData.name) {
            const newCommandId = match[1];
            window.removeEventListener("popstate", checkAndPatch);
            history.pushState = originalPushState;

            setTimeout(() => {
                sendPatchRequest(appId, newCommandId, capturedData.name, capturedData.description);
            }, 800);

            isMonitoring = false;
        }
    }

    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(history, arguments);
        if (isMonitoring) checkAndPatch();
    };
    window.addEventListener("popstate", checkAndPatch);

    // --- Intercept POST for new command creation ---
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
        if (options?.method === "POST" && url.includes("/commands") && options.body) {
            try {
                const parsed = JSON.parse(options.body);
                const entry = parsed.flow_source.nodes.find(n => n.type === "entry_command");

                if (entry?.data.name) {
                    capturedData = {
                        name: entry.data.name,
                        description: entry.data.description || ""
                    };
                    isMonitoring = true;

                    return originalFetch(url, options).then(res => {
                        checkAndPatch();
                        return res;
                    });
                }
            } catch (e) { }
        }
        return originalFetch(url, options);
    };

    console.log(PREFIX + " ready. Waiting for command creation...");
})();
