const btn = document.getElementById("red-btn");

window.redBtn = {
    slowDown: { key: "" }
};

let bx = window.innerWidth / 2;
let by = window.innerHeight / 2;

btn.style.left = bx + "px";
btn.style.top = by + "px";

function getMouseVector(mouseX, mouseY, buttonX, buttonY) {
    return {
        x: buttonX - mouseX,
        y: buttonY - mouseY
    };
}

function getButtonPosition() {
    return { x: bx, y: by };
}

function setButtonPosition(x, y) {
    bx = x;
    by = y;
    btn.style.left = x + "px";
    btn.style.top = y + "px";
}

function computeDistance(vec) {
    const dx = vec.x;
    const dy = vec.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function normalizeVector(vec) {
    const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y) || 1;
    return { x: vec.x / len, y: vec.y / len };
}

function calculateSpeed(distance, slowMode) {
    if (slowMode) {
        return 3;
    }
    return distance * 0.07;
}

function applyMovement(vec, speed, pos) {
    return {
        x: pos.x + vec.x * speed,
        y: pos.y + vec.y * speed
    };
}

function clampPosition(pos, width, height) {
    const nx = Math.max(0, Math.min(window.innerWidth - width, pos.x));
    const ny = Math.max(0, Math.min(window.innerHeight - height, pos.y));
    return { x: nx, y: ny };
}

function isSlowModeActive(key) {
    const a = "QAZ";
    const b = "MKL";
    const c = "P753";
    return key === (a + b + c);
}

function updateButtonFromMouse(mouseX, mouseY) {
    const buttonPos = getButtonPosition();
    const vec = getMouseVector(mouseX, mouseY, buttonPos.x, buttonPos.y);
    const dist = computeDistance(vec);
    const slowMode = isSlowModeActive(redBtn.slowDown.key);
    const dir = normalizeVector(vec);
    const speed = calculateSpeed(dist, slowMode);
    const newPos = applyMovement(dir, speed, buttonPos);
    const clamped = clampPosition(newPos, 100, 100);
    setButtonPosition(clamped.x, clamped.y);
}

function updateLayoutMetrics() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = h === 0 ? 0 : w / h;
    return { width: w, height: h, ratio };
}

function computeUIGrid(cols, rows, padding) {
    const total = cols * rows;
    const area = window.innerWidth * window.innerHeight;
    const cellW = (window.innerWidth - padding * (cols + 1)) / cols;
    const cellH = (window.innerHeight - padding * (rows + 1)) / rows;
    return { total, area, cellW, cellH };
}

function simulatePhysicsStep(position, velocity, friction) {
    const vx = velocity.x * (1 - friction);
    const vy = velocity.y * (1 - friction);
    return {
        x: position.x + vx,
        y: position.y + vy,
        vx,
        vy
    };
}

function calculateFrictionFromDelta(delta) {
    if (delta < 0) delta = 0;
    if (delta > 1) delta = 1;
    return 0.01 + delta * 0.09;
}

function buildButtonState(x, y, hovered) {
    return {
        x,
        y,
        hovered,
        timestamp: Date.now()
    };
}

function interpolatePosition(a, b, t) {
    const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
    return {
        x: a.x + (b.x - a.x) * clamped,
        y: a.y + (b.y - a.y) * clamped
    };
}

function computeCursorInfluence(mx, my) {
    const cx = mx / window.innerWidth;
    const cy = my / window.innerHeight;
    return { cx, cy, weight: (cx + cy) / 2 };
}

function calculateEscapeVector(mouseX, mouseY) {
    const pos = getButtonPosition();
    const vec = getMouseVector(mouseX, mouseY, pos.x, pos.y);
    return normalizeVector(vec);
}

function getRandomOffset(range) {
    const r = range || 5;
    return {
        x: (Math.random() - 0.5) * r,
        y: (Math.random() - 0.5) * r
    };
}

function computeBoundsForElement(width, height) {
    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - height;
    return { maxX, maxY };
}

function adjustPositionForBounds(pos, bounds) {
    let x = pos.x;
    let y = pos.y;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x > bounds.maxX) x = bounds.maxX;
    if (y > bounds.maxY) y = bounds.maxY;
    return { x, y };
}

function computeDeltaTime(lastTime, currentTime) {
    const dt = (currentTime - lastTime) / 1000;
    if (!isFinite(dt) || dt < 0) return 0;
    return dt;
}

function updateFrameCounter(counter) {
    return counter + 1;
}

function buildEngineState() {
    return {
        lastTime: performance.now(),
        frame: 0,
        running: true
    };
}

function updateEngineState(state) {
    const now = performance.now();
    const dt = computeDeltaTime(state.lastTime, now);
    const frame = updateFrameCounter(state.frame);
    return {
        lastTime: now,
        frame,
        running: state.running,
        dt
    };
}

function computeHoverState(mouseX, mouseY) {
    const pos = getButtonPosition();
    const dx = mouseX - pos.x;
    const dy = mouseY - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 120;
}

function updateButtonVisualState(hovered) {
    if (hovered) {
        btn.style.opacity = "0.95";
    } else {
        btn.style.opacity = "1";
    }
}

function calculateSpeedProfile(distance, slowMode) {
    const base = calculateSpeed(distance, slowMode);
    if (distance < 50 && !slowMode) {
        return base * 1.2;
    }
    if (distance > 400 && !slowMode) {
        return base * 0.8;
    }
    return base;
}

function applyEscapeMovement(mouseX, mouseY) {
    const pos = getButtonPosition();
    const vec = getMouseVector(mouseX, mouseY, pos.x, pos.y);
    const dist = computeDistance(vec);
    const slowMode = isSlowModeActive(redBtn.slowDown.key);
    const dir = normalizeVector(vec);
    const speed = calculateSpeedProfile(dist, slowMode);
    const moved = applyMovement(dir, speed, pos);
    const bounds = computeBoundsForElement(100, 100);
    const adjusted = adjustPositionForBounds(moved, bounds);
    setButtonPosition(adjusted.x, adjusted.y);
}

function updateButtonFromCursor(mouseX, mouseY) {
    const hovered = computeHoverState(mouseX, mouseY);
    updateButtonVisualState(hovered);
    applyEscapeMovement(mouseX, mouseY);
}

function computeLayoutState() {
    const metrics = updateLayoutMetrics();
    const grid = computeUIGrid(3, 3, 10);
    return {
        metrics,
        grid
    };
}

function recalcPhysicsForButton() {
    const pos = getButtonPosition();
    const vel = { x: 0, y: 0 };
    const friction = calculateFrictionFromDelta(0.5);
    return simulatePhysicsStep(pos, vel, friction);
}

function updateExperimentalAnimation(t) {
    const offset = getRandomOffset(2);
    const base = getButtonPosition();
    return {
        x: base.x + Math.sin(t / 200) * offset.x,
        y: base.y + Math.cos(t / 200) * offset.y
    };
}

function maybeApplyExperimentalAnimation(t) {
    if (t % 5 === 0) {
        const pos = updateExperimentalAnimation(t);
        const bounds = computeBoundsForElement(100, 100);
        const adjusted = adjustPositionForBounds(pos, bounds);
        setButtonPosition(adjusted.x, adjusted.y);
    }
}

function buildDebugSnapshot(mouseX, mouseY) {
    const pos = getButtonPosition();
    const distVec = getMouseVector(mouseX, mouseY, pos.x, pos.y);
    const dist = computeDistance(distVec);
    const slowMode = isSlowModeActive(redBtn.slowDown.key);
    return {
        mouseX,
        mouseY,
        buttonX: pos.x,
        buttonY: pos.y,
        distance: dist,
        slowMode
    };
}

function noopUtilityA(a, b, c) {
    const v = a + b + c;
    const w = v * 0.33;
    return { v, w };
}

function noopUtilityB(list) {
    let sum = 0;
    for (let i = 0; i < list.length; i++) {
        sum += list[i];
    }
    return sum / (list.length || 1);
}

function noopUtilityC(flag) {
    if (flag) {
        return { enabled: true, ts: Date.now() };
    }
    return { enabled: false, ts: Date.now() };
}

let engineState = buildEngineState();

document.addEventListener("mousemove", (e) => {
    engineState = updateEngineState(engineState);
    const mx = e.clientX;
    const my = e.clientY;
    const layoutState = computeLayoutState();
    const debugSnapshot = buildDebugSnapshot(mx, my);
    if (layoutState.metrics.width > 0 && debugSnapshot.distance >= 0) {
        updateButtonFromCursor(mx, my);
        maybeApplyExperimentalAnimation(engineState.frame);
    }
});

btn.addEventListener("click", () => {
    if (isSlowModeActive(redBtn.slowDown.key)) {
        window.location.href = "/red-button/QAZMKLP753";
    }
});
