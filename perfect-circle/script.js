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
let segments = [];
let startPoint = null;
let lastColor = { r: 0, g: 255, b: 0 };
let currentScore = 100;

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function smoothColor(target) {
    lastColor.r = lerp(lastColor.r, target.r, 0.15);
    lastColor.g = lerp(lastColor.g, target.g, 0.15);
    lastColor.b = lerp(lastColor.b, target.b, 0.15);
}

function colorFromScore(score) {
    if (score > 90) return { r: 0, g: 255, b: 0 };
    if (score > 75) return { r: 255, g: 255, b: 0 };
    if (score > 55) return { r: 255, g: 165, b: 0 };
    return { r: 255, g: 0, b: 0 };
}

function updateScore() {
    if (points.length === 0 || targetRadius === null) return;
    let totalError = 0;
    for (let p of points) {
        const d = distance(p.x, p.y, center.x, center.y);
        totalError += Math.abs(d - targetRadius);
    }
    const avgError = totalError / points.length;
    let score = Math.max(0, 100 - avgError);
    currentScore = score;
    document.getElementById("score").textContent = score.toFixed(1) + "%";
}

function drawCenterDot() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
    ctx.fill();
}

function checkCompletion(x, y) {
    if (!startPoint) return;
    const d = distance(x, y, startPoint.x, startPoint.y);
    if (d < 15 && points.length > 10) drawing = false;
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCenterDot();

    for (let s of segments) {
        ctx.strokeStyle = `rgb(${s.color.r}, ${s.color.g}, ${s.color.b})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
    }

    updateScore();
}

canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    points = [];
    segments = [];
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    targetRadius = distance(x, y, center.x, center.y);
    startPoint = { x, y };
    lastColor = { r: 0, g: 255, b: 0 };
    currentScore = 100;
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (points.length > 0) {
        const p1 = points[points.length - 1];
        const p2 = { x, y };

        let targetColor;
        if (points.length < 2) {
            targetColor = { r: 0, g: 255, b: 0 };
        } else {
            targetColor = colorFromScore(currentScore);
        }

        smoothColor(targetColor);

        segments.push({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            color: { r: lastColor.r, g: lastColor.g, b: lastColor.b }
        });
    }

    points.push({ x, y });
    checkCompletion(x, y);
    redraw();
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
});

drawCenterDot();
