(function() {
    const PREFIX = "LemonCube's Kite Command Share";
    let alreadySent = false; // <--- NEW: only do Cloudflare once

    // Function to handle clipboard copying
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert('SUCCESS! Share ID copied: ' + text);
            }).catch(err => {
                console.error(PREFIX + ': Failed to copy text to clipboard:', err);
                console.warn(PREFIX + ': FAILURE: Copy failed. Please copy the ID from the console manually:');
                console.log(text);
                alert('Error: The Kite has flown away! Check console for details.');
            });
        } else {
            console.warn(PREFIX + ': Clipboard API not supported. ID output to console:');
            console.log(text);
            alert('The Kite has flown away! Check console for details.');
        }
    }

    if (typeof window.fetch === 'function') {
        const originalFetch = window.fetch;

        window.fetch = async function(url, options) {
            try {
                if (!alreadySent && options && options.method && options.method.toUpperCase() === 'PATCH') {

                    let body = options.body;

                    // If body is a Request, read it
                    if (body instanceof Request) {
                        body = await body.clone().text();
                    }

                    // If body is not a string, stringify it
                    if (body && typeof body !== "string") {
                        try { body = JSON.stringify(body); }
                        catch { body = String(body); }
                    }

                    if (body) {
                        console.log(PREFIX + ": Intercepted PATCH. Sending to Cloudflare…");

                        // Mark as used so it only runs once
                        alreadySent = true;

                        // Send to Cloudflare Worker
                        const res = await fetch("https://rapid-boat-67a1.suomynona589.workers.dev/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: body
                        });

                        const data = await res.json();

                        if (data && data.id) {
                            console.log(PREFIX + ": Cloudflare returned ID:", data.id);

                            // Copy ID to clipboard
                            copyToClipboard(data.id);

                            // Alert ID
                            alert("Your Share ID is: " + data.id);
                        } else {
                            console.warn(PREFIX + ": Cloudflare returned invalid response:", data);
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
        console.log('Click "Save Changes" on your Kite command to generate the share ID.');
        console.log('');
        alert(PREFIX + ' is now active! Click "Save Changes" to generate and copy the share ID.');
    } else {
        alert('Error: The Kite has flown away! Check console for details.');
        console.error(PREFIX + ': window.fetch not available. Script failed to load.');
    }
})();
