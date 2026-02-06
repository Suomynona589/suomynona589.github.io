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
let lastAngle = null;
let directionSign = 0;
let wrongWay = false;

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

function getColorForError(error) {
    if (error < 3) return { r: 0, g: 255, b: 0 };
    if (error < 8) return { r: 255, g: 255, b: 0 };
    if (error < 15) return { r: 255, g: 165, b: 0 };
    return { r: 255, g: 0, b: 0 };
}

function normalizeAngleDiff(a) {
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
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
    if (d < 15 && points.length > 10) {
        drawing = false;
        return;
    }
    if (Math.abs(x - startPoint.x) < 10 && points.length > 10) {
        drawing = false;
    }
}

function checkDirection(x, y) {
    const angle = Math.atan2(y - center.y, x - center.x);
    if (lastAngle === null) {
        lastAngle = angle;
        return;
    }
    let diff = normalizeAngleDiff(angle - lastAngle);
    if (Math.abs(diff) < 0.01) {
        lastAngle = angle;
        return;
    }
    if (directionSign === 0) {
        directionSign = diff > 0 ? 1 : -1;
    } else {
        if (diff * directionSign < -0.05) {
            drawing = false;
            wrongWay = true;
            document.getElementById("message").textContent = "Wrong Way.";
        }
    }
    lastAngle = angle;
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
    lastAngle = null;
    directionSign = 0;
    wrongWay = false;
    document.getElementById("message").textContent = "";
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (wrongWay) return;

    if (points.length > 0) {
        const p1 = points[points.length - 1];
        const p2 = { x, y };
        const d = distance(p2.x, p2.y, center.x, center.y);
        const error = Math.abs(d - targetRadius);
        const targetColor = getColorForError(error);
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
    checkDirection(x, y);
    if (!wrongWay) {
        checkCompletion(x, y);
        redraw();
    }
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
});

drawCenterDot();
