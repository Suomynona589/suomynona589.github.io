(function() {
    const PREFIX = "LemonCube's Kite Command Share";
    let storedPayload = null;
    let capturedData = { name: null, description: null };
    let isMonitoring = false;

    // --- Setup Checks ---
    const urlMatch = window.location.pathname.match(/\/apps\/([^\/]+)/);
    if (!urlMatch) {
        console.warn(PREFIX + ": Not on a valid Kite app page.");
        return;
    }
    const appId = urlMatch[1];

    // Determine API base (supports self-hosted)
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    const apiBase =
        host === "kite.onl" || host === "www.kite.onl"
            ? "https://api.kite.onl"
            : `${protocol}//${host}${port}`;

    // --- Step 1: Prompt for SHARE ID ---
    const shareId = prompt(PREFIX + " activated!\n\nEnter the SHARE ID:");
    if (!shareId) {
        console.log(PREFIX + ": Cancelled.");
        return;
    }

    // --- Step 2: Fetch JSON from Cloudflare Worker ---
    fetch(`https://rapid-boat-67a1.suomynona589.workers.dev/${shareId}`)
        .then(r => r.json())
        .then(data => {
            if (!data || !data.json) {
                alert("Invalid ID or missing JSON.");
                return;
            }

            storedPayload = JSON.stringify(data.json);

            alert(
                "Share code loaded!\n\n" +
                "Now create a NEW command with ANY name.\n" +
                "The script will automatically replace it with the shared command."
            );
        })
        .catch(err => {
            console.error(PREFIX + ": Failed to fetch share JSON:", err);
            alert("Failed to fetch share JSON. Check console.");
        });

    // --- PATCH Sender ---
    function sendPatchRequest(appId, commandId, name, description) {
        let finalPayload;

        try {
            const parsed = JSON.parse(storedPayload);

            parsed.flow_source.nodes = parsed.flow_source.nodes.map(node => {
                if (node.type === "entry_command") {
                    node.data.name = name;
                    node.data.description = description;
                }
                return node;
            });

            finalPayload = JSON.stringify(parsed);
        } catch (e) {
            console.error(PREFIX + ": Failed to modify JSON:", e);
            alert("Error modifying payload. Check console.");
            return;
        }

        console.log(PREFIX + ": Sending PATCH to load command...");

        fetch(`${apiBase}/v1/apps/${appId}/commands/${commandId}`, {
            method: "PATCH",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: finalPayload
        })
            .then(async res => {
                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(`HTTP ${res.status}: ${errText}`);
                }
                return res.json();
            })
            .then(result => {
                console.log(PREFIX + ": Success!", result);
                alert(
                    "Success! The shared command has been loaded onto your account.\n\n" +
                    "Reload the page to view & edit it."
                );
            })
            .catch(err => {
                console.error(PREFIX + ": PATCH failed:", err);
                alert("PATCH failed. Check console.");
            });
    }

    // --- URL Monitoring ---
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
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        if (isMonitoring) checkAndPatch();
    };
    window.addEventListener("popstate", checkAndPatch);

    // --- Fetch Interceptor (captures new command creation) ---
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (
            options?.method?.toUpperCase() === "POST" &&
            url.includes("/commands") &&
            options.body
        ) {
            try {
                const parsed = JSON.parse(options.body);
                const entryNode = parsed.flow_source.nodes.find(
                    node => node.type === "entry_command"
                );

                if (entryNode?.data.name) {
                    console.log(PREFIX + ": New command detected. Capturing name/description...");

                    capturedData = {
                        name: entryNode.data.name,
                        description: entryNode.data.description || ""
                    };

                    isMonitoring = true;

                    return originalFetch(url, options).then(res => {
                        checkAndPatch();
                        return res;
                    });
                }
            } catch (e) {
                // ignore parse errors
            }
        }

        return originalFetch(url, options);
    };

    console.log(PREFIX + ": Receiver ready. Waiting for new command...");
})();
