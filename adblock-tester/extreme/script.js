document.addEventListener("DOMContentLoaded", () => {
    const staticBlocked = localStorage.getItem("staticBlocked") === "true";
    const gifBlocked = localStorage.getItem("gifBlocked") === "true";
    const sponsorBlocked = localStorage.getItem("sponsorBlocked") === "true";
    const iframeBlocked = localStorage.getItem("iframeBlocked") === "true";
    const flashBlocked = localStorage.getItem("flashBlocked") === "true";

    const blockedList = [];

    if (staticBlocked) blockedList.push("static");
    if (gifBlocked) blockedList.push("gif");
    if (sponsorBlocked) blockedList.push("sponsor");
    if (iframeBlocked) blockedList.push("iframe");
    if (flashBlocked) blockedList.push("flash");

    const container = document.getElementById("extreme-container");

    if (blockedList.length === 0) {
        const msg = document.createElement("div");
        msg.className = "no-pass";
        msg.innerHTML = "You didn't pass the first test yet.<br>";

        const btn = document.createElement("button");
        btn.textContent = "Return to first test";
        btn.onclick = () => {
            window.location.href = "/adblock-tester/normal";
        };

        msg.appendChild(btn);
        container.appendChild(msg);
        return;
    }

    let chosen = null;

    if (gifBlocked) {
        chosen = "gif";
    } else {
        chosen = blockedList[Math.floor(Math.random() * blockedList.length)];
    }

    if (chosen === "static") {
        container.innerHTML = `
        <div class="test-box extreme-box">
            <h2>Static Image Ad</h2>
            <img src="/images/ads/static-image.png" class="extreme-ad">
        </div>`;
    }

    if (chosen === "gif") {
        container.innerHTML = `
        <div class="test-box extreme-box">
            <h2>GIF Image Ad</h2>
            <img src="https://c.tenor.com/bxe8Qsx3UusAAAAC/tenor.gif" class="extreme-ad">
        </div>`;
    }

    if (chosen === "sponsor") {
        container.innerHTML = `
        <div class="test-box extreme-box">
            <h2>Sponsored Content Block</h2>
            <div class="sponsored-block extreme-ad">
                <span class="sponsored-label">Sponsored</span>
                <p>This is a fake sponsored article preview with ad-like styling.</p>
                <img src="/images/ads/sponsor-logo.png" class="sponsored">
            </div>
        </div>`;
    }

    if (chosen === "iframe") {
        container.innerHTML = `
        <div class="test-box extreme-box">
            <h2>Iframe Ad</h2>
            <iframe src="https://example.com" class="extreme-ad" width="300" height="100"></iframe>
        </div>`;
    }

    if (chosen === "flash") {
        container.innerHTML = `
        <div class="test-box extreme-box">
            <h2>Flash Banner</h2>
            <object data="/images/ads/flash-banner.swf" class="extreme-ad" width="300" height="250"></object>
        </div>`;
    }

    const ad = document.querySelector(".extreme-ad");
    const box = document.querySelector(".extreme-box");

    const observer = new MutationObserver(() => {
        if (!document.body.contains(ad)) showOverlay();
        const rect = ad.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) showOverlay();
        if (ad.style.display === "none") showOverlay();
        if (box.style.display === "none") showOverlay();
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    function showOverlay() {
        if (document.querySelector(".overlay")) return;

        const overlay = document.createElement("div");
        overlay.className = "overlay";
        overlay.innerHTML = `
            <div class="overlay-content">
                We detected interference from an ad blocker.
            </div>
        `;
        document.body.appendChild(overlay);
    }
});
