const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gridSize = 40;
let cols = Math.floor(canvas.width / gridSize);
let rows = Math.floor(canvas.height / gridSize);

let grid = Array.from({ length: rows }, () => Array(cols).fill(0));

let player = {
    x: Math.floor(cols / 2),
    y: Math.floor(rows / 2),
    speed: 0.12,
    vx: 0.12,
    vy: 0,
    trail: [],
    inTerritory: true
};

grid[player.y][player.x] = 1;

let mousePos = null;
let touchTarget = null;

const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / gridSize);
    rows = Math.floor(canvas.height / gridSize);
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    player.x = Math.floor(cols / 2);
    player.y = Math.floor(rows / 2);
    grid[player.y][player.x] = 1;
    player.trail = [];
});

if (!isTouch) {
    canvas.addEventListener("mousemove", e => {
        mousePos = { x: e.clientX, y: e.clientY };
    });
} else {
    canvas.addEventListener("touchstart", e => {
        let t = e.touches[0];
        touchTarget = { x: t.clientX, y: t.clientY };
    });

    canvas.addEventListener("touchmove", e => {
        let t = e.touches[0];
        touchTarget = { x: t.clientX, y: t.clientY };
    });

    canvas.addEventListener("touchend", () => {
        touchTarget = null;
    });
}

function updateDirection() {
    let target = null;

    if (isTouch) {
        if (touchTarget) target = touchTarget;
    } else {
        if (mousePos) target = mousePos;
    }

    if (!target) return;

    let px = player.x * gridSize + gridSize / 2;
    let py = player.y * gridSize + gridSize / 2;
    let dx = target.x - px;
    let dy = target.y - py;
    let d = Math.hypot(dx, dy);
    if (d > 1) {
        player.vx = (dx / d) * player.speed;
        player.vy = (dy / d) * player.speed;
    }
}

function updatePlayer() {
    updateDirection();

    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(0, Math.min(cols - 1, player.x));
    player.y = Math.max(0, Math.min(rows - 1, player.y));

    let cx = Math.floor(player.x);
    let cy = Math.floor(player.y);

    if (grid[cy] && grid[cy][cx] === 1) {
        if (!player.inTerritory && player.trail.length > 2) {
            fillTrailArea();
        }
        player.inTerritory = true;
        player.trail = [];
    } else {
        player.inTerritory = false;
        let last = player.trail[player.trail.length - 1];
        if (!last || last.x !== cx || last.y !== cy) {
            player.trail.push({ x: cx, y: cy });
        }
    }
}

function fillTrailArea() {
    let temp = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x] === 1) temp[y][x] = 1;
        }
    }

    for (let p of player.trail) {
        if (p.y >= 0 && p.y < rows && p.x >= 0 && p.x < cols) {
            temp[p.y][p.x] = 1;
        }
    }

    let visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    let queue = [];

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
                if (temp[y][x] === 0 && !visited[y][x]) {
                    visited[y][x] = true;
                    queue.push({ x, y });
                }
            }
        }
    }

    while (queue.length) {
        let { x, y } = queue.shift();
        let neighbors = [
            { x: x + 1, y },
            { x: x - 1, y },
            { x, y: y + 1 },
            { x, y: y - 1 }
        ];
        for (let n of neighbors) {
            if (
                n.x >= 0 &&
                n.x < cols &&
                n.y >= 0 &&
                n.y < rows &&
                temp[n.y][n.x] === 0 &&
                !visited[n.y][n.x]
            ) {
                visited[n.y][n.x] = true;
                queue.push(n);
            }
        }
    }

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (temp[y][x] === 0 && !visited[y][x]) {
                grid[y][x] = 1;
            }
        }
    }

    for (let p of player.trail) {
        if (p.y >= 0 && p.y < rows && p.x >= 0 && p.x < cols) {
            grid[p.y][p.x] = 1;
        }
    }

    player.trail = [];
}

function drawHex(cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 3 * i + Math.PI / 6;
        let x = cx + r * Math.cos(angle);
        let y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

function drawHexOutline(cx, cy, r, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 3 * i + Math.PI / 6;
        let x = cx + r * Math.cos(angle);
        let y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
}

function draw() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let cx = x * gridSize + gridSize / 2;
            let cy = y * gridSize + gridSize / 2;

            drawHexOutline(cx, cy, gridSize * 0.6, "#dddddd");

            if (grid[y][x] === 1) {
                drawHex(cx, cy, gridSize * 0.6, "#000000");
            }
        }
    }

    for (let p of player.trail) {
        let cx = p.x * gridSize + gridSize / 2;
        let cy = p.y * gridSize + gridSize / 2;
        drawHex(cx, cy, gridSize * 0.6, "#cccccc");
    }

    let px = player.x * gridSize + gridSize / 2;
    let py = player.y * gridSize + gridSize / 2;
    ctx.fillStyle = "#0077ff";
    ctx.beginPath();
    ctx.arc(px, py, gridSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function loop() {
    updatePlayer();
    draw();
    requestAnimationFrame(loop);
}

loop();
