const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const gridSize = 40;
let cols = Math.floor(canvas.width / gridSize);
let rows = Math.floor(canvas.height / gridSize);

let grid = Array.from({ length: rows }, () => Array(cols).fill(0));

let player = {
    x: Math.floor(cols / 2),
    y: Math.floor(rows / 2),
    speed: 0.4,
    vx: 0,
    vy: 0,
    trail: [],
    inTerritory: true
};

let keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function updatePlayer() {
    if (keys["w"] || keys["ArrowUp"]) player.vy = -player.speed;
    else if (keys["s"] || keys["ArrowDown"]) player.vy = player.speed;
    else player.vy = 0;

    if (keys["a"] || keys["ArrowLeft"]) player.vx = -player.speed;
    else if (keys["d"] || keys["ArrowRight"]) player.vx = player.speed;
    else player.vx = 0;

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
    cols = Math.floor(canvas.width / gridSize);
    rows = Math.floor(canvas.height / gridSize);
    updatePlayer();
    draw();
    requestAnimationFrame(loop);
}

loop();
