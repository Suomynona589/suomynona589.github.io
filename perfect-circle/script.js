const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const center = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

let drawing = false;
let targetRadius = null;
let points = [];

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function updateScore() {
    if (points.length === 0 || targetRadius === null) return;

    let totalError = 0;

    for (let p of points) {
        const d = distance(p.x, p.y, center.x, center.y);
        const error = Math.abs(d - targetRadius);
        totalError += error;
    }

    const avgError = totalError / points.length;

    // Convert error into a score (you can tune this)
    let score = Math.max(0, 100 - avgError);
    score = score.toFixed(1);

    document.getElementById("score").textContent = score + "%";
}

function drawCenterDot() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
    ctx.fill();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCenterDot();

    // Draw the user's stroke
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    updateScore();
}

canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    points = [];

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    targetRadius = distance(x, y, center.x, center.y);
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    points.push({ x, y });
    redraw();
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
});

drawCenterDot();
