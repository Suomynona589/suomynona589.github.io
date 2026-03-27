(function() {
    const PREFIX = "LemonCube's Kite Command Share";
    let alreadySent = false; // Only process first PATCH

    // Clean clipboard function — no fallback alerts
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(err => {
                console.error(PREFIX + ": Clipboard copy failed:", err);
            });
        } else {
            console.warn(PREFIX + ": Clipboard API not supported.");
        }
    }

    if (typeof window.fetch === 'function') {
        const originalFetch = window.fetch;

        window.fetch = async function(url, options) {
            try {
                if (!alreadySent &&
                    options &&
                    options.method &&
                    options.method.toUpperCase() === 'PATCH') {

                    let body = options.body;

                    // Handle Request object bodies
                    if (body instanceof Request) {
                        body = await body.clone().text();
                    }

                    // Ensure body is a string
                    if (body && typeof body !== "string") {
                        try { body = JSON.stringify(body); }
                        catch { body = String(body); }
                    }

                    if (body) {
                        console.log(PREFIX + ": Sending to Cloudflare…");

                        alreadySent = true; // Prevent duplicates

                        // Send to Cloudflare Worker
                        const res = await fetch("https://rapid-boat-67a1.suomynona589.workers.dev/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: body
                        });

                        const data = await res.json();

                        if (data && data.id) {
                            console.log(PREFIX + ": Cloudflare returned ID:", data.id);

                            // Copy ID to clipboard (no fallback alerts)
                            copyToClipboard(data.id);

                            // ALWAYS alert the ID
                            alert("Your Share ID: " + data.id);
                        } else {
                            console.warn(PREFIX + ": Invalid Cloudflare response:", data);
                            alert("Error: Cloudflare returned an invalid response.");
                        }
                    }
                }
            } catch (err) {
                console.error(PREFIX + ": Error while intercepting PATCH:", err);
            }

            return originalFetch(url, options);
        };

        console.log('');
        console.log('--- ' + PREFIX + ' ---');
        console.log('Click \"Save Changes\" on your Kite command to generate the share ID.');
        console.log('');
        alert(PREFIX + " is active! Click Save Changes to generate your share id.");
    } else {
        console.error(PREFIX + ": window.fetch not available.");
        alert("Error: fetch not available.");
    }
})();
