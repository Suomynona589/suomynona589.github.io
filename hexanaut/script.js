const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / gridSize);
    rows = Math.floor(canvas.height / gridSize);
});

const gridSize = 40;
let cols = Math.floor(canvas.width / gridSize);
let rows = Math.floor(canvas.height / gridSize);

let grid = Array.from({ length: rows }, () => Array(cols).fill(0));

let player = {
    x: Math.floor(cols / 2),
    y: Math.floor(rows / 2),
    speed: 0.25,
    vx: 0,
    vy: 0,
    trail: [],
    inTerritory: true
};

let target = null;

canvas.addEventListener("mousedown", e => {
    target = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("mousemove", e => {
    if (target) target = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("mouseup", () => {
    target = null;
    player.vx = 0;
    player.vy = 0;
});

canvas.addEventListener("touchstart", e => {
    let t = e.touches[0];
    target = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchmove", e => {
    let t = e.touches[0];
    target = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchend", () => {
    target = null;
    player.vx = 0;
    player.vy = 0;
});

function updatePlayer() {
    if (target) {
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

    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(0, Math.min(cols - 1, player.x));
    player.y = Math.max(0, Math.min(rows - 1, player.y));

    let cx = Math.floor(player.x);
    let cy = Math.floor(player.y);

    if (grid[cy][cx] === 1) {
        if (!player.inTerritory && player.trail.length > 2) {
            fillTrail();
        }
        player.inTerritory = true;
        player.trail = [];
    } else {
        player.inTerritory = false;
        player.trail.push({ x: cx, y: cy });
    }
}

function fillTrail() {
    for (let p of player.trail) {
        grid[p.y][p.x] = 1;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0f0";
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x] === 1) {
                ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
            }
        }
    }

    ctx.fillStyle = "#0ff";
    for (let p of player.trail) {
        ctx.fillRect(p.x * gridSize, p.y * gridSize, gridSize, gridSize);
    }

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(
        player.x * gridSize + gridSize / 2,
        player.y * gridSize + gridSize / 2,
        gridSize * 0.4,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function loop() {
    updatePlayer();
    draw();
    requestAnimationFrame(loop);
}

loop();
