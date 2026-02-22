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
        <div class="test-box" data-test="1">
        <h2>Static Image Ad</h2>
        <p class="note">Should be blocked</p>
        <img src="/images/ads/static-image.png" class="ad ad-banner static" alt="Static Ad Image">
    </div>`;
    }

    if (chosen === "gif") {
        container.innerHTML = `
        <div class="test-box" data-test="2">
        <h2>GIF Image Ad</h2>
        <p class="note">Should be blocked</p>
        <img src="https://c.tenor.com/bxe8Qsx3UusAAAAC/tenor.gif" class="ad ad-banner" alt="GIF Ad">
    </div>`;
    }

    if (chosen === "sponsor") {
        container.innerHTML = `
        <div class="test-box" data-test="3">
        <h2>Sponsored Content Block</h2>
        <p class="note">Often blocked by cosmetic filters</p>
        <div class="sponsored-block">
            <span class="sponsored-label">Sponsored</span>
            <p>This is a fake sponsored article preview with ad-like styling.</p>
            <img src="/images/ads/sponsor-logo.png" class="sponsored" alt="Sponsor Logo">
        </div>
    </div>`;
    }

    if (chosen === "iframe") {
        container.innerHTML = `
        <div class="test-box" data-test="4">
        <h2>Iframe Ad</h2>
        <p class="note">Should be blocked</p>
        <iframe
            src="https://example.com"
            class="ad iframe-ad"
            width="300"
            height="100"
            title="Fake Iframe Ad">
        </iframe>
    </div>`;
    }

    if (chosen === "flash") {
        container.innerHTML = `
        <div class="test-box" data-test="5">
        <h2>Flash Banner</h2>
        <p class="note">Should be blocked</p>
        <object
            data="/images/ads/flash-banner.swf"
            class="ad flash swf"
            width="300"
            height="250">
        </object>
        <p class="note">Browsers will not play this, but it is useful for detection tests.</p>
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
