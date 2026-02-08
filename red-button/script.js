const btn = document.getElementById("red-btn");

let bx = window.innerWidth / 2;
let by = window.innerHeight / 2;

btn.style.left = bx + "px";
btn.style.top = by + "px";

function getVector(mx, my, bx, by) {
    return { x: bx - mx, y: by - my };
}

function getDistance(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
    return { x: v.x / len, y: v.y / len };
}

window.redBtn = {
    slowDown: {
        key: "",
        set(v) {
            this.key = v;
            return "Button Slowed";
        }
    }
};

function isSlowModeActive(k) {
    return k === "QAZMKLP753";
}

function calculateSpeed(distance, slowMode) {
    if (slowMode) return 2.5;
    return 260 / Math.max(distance, 1);
}

function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

function cornerAwareDirection(dir, x, y) {
    const margin = 5;
    const maxX = window.innerWidth - 70 - margin;
    const maxY = window.innerHeight - 70 - margin;

    const nearLeft = x <= margin;
    const nearRight = x >= maxX;
    const nearTop = y <= margin;
    const nearBottom = y >= maxY;

    if (nearLeft && dir.x < 0) dir.x = Math.abs(dir.x);
    if (nearRight && dir.x > 0) dir.x = -Math.abs(dir.x);
    if (nearTop && dir.y < 0) dir.y = Math.abs(dir.y);
    if (nearBottom && dir.y > 0) dir.y = -Math.abs(dir.y);

    return dir;
}

function updateButton(mx, my) {
    const vec = getVector(mx, my, bx, by);
    const dist = getDistance(vec);
    let dir = normalize(vec);

    dir = cornerAwareDirection(dir, bx, by);

    const speed = calculateSpeed(dist, isSlowModeActive(redBtn.slowDown.key));

    let newX = bx + dir.x * speed;
    let newY = by + dir.y * speed;

    const margin = 5;
    const maxX = window.innerWidth - 70 - margin;
    const maxY = window.innerHeight - 70 - margin;

    newX = clamp(newX, margin, maxX);
    newY = clamp(newY, margin, maxY);

    bx = newX;
    by = newY;

    btn.style.left = bx + "px";
    btn.style.top = by + "px";
}

btn.addEventListener("click", () => {
    if (isSlowModeActive(redBtn.slowDown.key)) {
        window.location.href = "/red-button/QAZMKLP753";
    }
});

document.addEventListener("mousemove", (e) => {
    updateButton(e.clientX, e.clientY);
});
