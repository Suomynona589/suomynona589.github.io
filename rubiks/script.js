// script.js
// A "huge" script to manage a little Rubik's cube painter + toy solver UI.

// =========================
// Global configuration
// =========================

const FACE_ORDER = ["U", "R", "F", "D", "L", "B"]; // Up, Right, Front, Down, Left, Back
// We will encode the cube state as digits 0–5 in this order:
// 0 = U (yellow), 1 = R (red), 2 = F (green), 3 = D (white), 4 = L (orange), 5 = B (blue)
const FACE_TO_DIGIT = {
  U: "0",
  R: "1",
  F: "2",
  D: "3",
  L: "4",
  B: "5",
};
const DIGIT_TO_FACE = {
  "0": "U",
  "1": "R",
  "2": "F",
  "3": "D",
  "4": "L",
  "5": "B",
};

// Colors for drawing tiles
const FACE_COLORS = {
  U: "#ffff00", // yellow
  D: "#ffffff", // white
  F: "#00aa00", // green
  B: "#0000ff", // blue
  R: "#ff0000", // red
  L: "#ff8800", // orange
};

// Default "unpainted" tile color
const UNPAINTED_COLOR = "#000000"; // black

// =========================
// State
// =========================

// 54 tiles: 6 faces * 9 tiles each.
// We'll store as an array of face letters or null for unpainted.
let cubeState = new Array(54).fill(null);

// Currently selected color (face letter)
let currentColor = null;

// For moving the cube container with arrow keys
let cubeOffsetX = 0;
let cubeOffsetY = 0;

// =========================
// DOM references
// =========================

const cubeContainer = document.getElementById("cube-container");
const paletteButtons = document.querySelectorAll(".color-btn");
const stateOutput = document.getElementById("state-output");
const copyStateBtn = document.getElementById("copy-state");
const solveBtn = document.getElementById("solve-btn");
const solverResult = document.getElementById("solver-result");

// =========================
// Utility functions
// =========================

/**
 * Get index in cubeState for a given face and tile index (0–8).
 * We store faces in FACE_ORDER, each with 9 tiles.
 */
function getGlobalIndex(face, tileIndex) {
  const faceIdx = FACE_ORDER.indexOf(face);
  return faceIdx * 9 + tileIndex;
}

/**
 * Get the face and tile index from a global index 0–53.
 */
function getFaceAndTile(globalIndex) {
  const faceIdx = Math.floor(globalIndex / 9);
  const tileIdx = globalIndex % 9;
  return {
    face: FACE_ORDER[faceIdx],
    tileIndex: tileIdx,
  };
}

/**
 * Convert cubeState (array of face letters or null) to a 54-char string of digits 0–5.
 * Unpainted tiles will be encoded as "0" (Up) just so the string is valid length.
 * In a real solver you'd want to enforce a valid cube; here we just mirror the idea.
 */
function encodeCubeStateToDigits() {
  let result = "";
  for (let i = 0; i < cubeState.length; i++) {
    const face = cubeState[i];
    if (!face) {
      // default to U if unpainted
      result += FACE_TO_DIGIT["U"];
    } else {
      result += FACE_TO_DIGIT[face] || FACE_TO_DIGIT["U"];
    }
  }
  return result;
}

/**
 * Update the state textarea with the current encoded string.
 */
function refreshStateOutput() {
  const encoded = encodeCubeStateToDigits();
  stateOutput.value = encoded;
}

/**
 * Apply the current cubeOffsetX/Y to the cube container.
 */
function applyCubeTransform() {
  cubeContainer.style.transform = `translate(${cubeOffsetX}px, ${cubeOffsetY}px)`;
}

/**
 * Set the current selected color.
 */
function setCurrentColor(faceLetter) {
  currentColor = faceLetter;
  paletteButtons.forEach((btn) => {
    if (btn.dataset.color === faceLetter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

/**
 * Get tile background color for a given cubeState entry.
 */
function getTileColor(faceLetterOrNull) {
  if (!faceLetterOrNull) return UNPAINTED_COLOR;
  return FACE_COLORS[faceLetterOrNull] || UNPAINTED_COLOR;
}

// =========================
// Cube UI creation
// =========================

/**
 * Create a 3x3 grid for a single face.
 */
function createFaceElement(face) {
  const faceEl = document.createElement("div");
  faceEl.className = "face";
  faceEl.dataset.face = face;

  const title = document.createElement("div");
  title.className = "face-title";
  title.textContent = face;
  faceEl.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "face-grid";

  for (let i = 0; i < 9; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    const globalIndex = getGlobalIndex(face, i);
    tile.dataset.globalIndex = String(globalIndex);
    tile.style.backgroundColor = getTileColor(cubeState[globalIndex]);
    tile.addEventListener("click", onTileClick);
    grid.appendChild(tile);
  }

  faceEl.appendChild(grid);
  return faceEl;
}

/**
 * Build the cube net layout:
 *
 *       [U]
 * [L] [F] [R] [B]
 *       [D]
 */
function buildCubeUI() {
  cubeContainer.innerHTML = "";

  const net = document.createElement("div");
  net.className = "cube-net";

  // Row 1: empty, U, empty, empty
  const row1 = document.createElement("div");
  row1.className = "cube-row";
  row1.appendChild(createSpacer());
  row1.appendChild(createFaceElement("U"));
  row1.appendChild(createSpacer());
  row1.appendChild(createSpacer());

  // Row 2: L, F, R, B
  const row2 = document.createElement("div");
  row2.className = "cube-row";
  row2.appendChild(createFaceElement("L"));
  row2.appendChild(createFaceElement("F"));
  row2.appendChild(createFaceElement("R"));
  row2.appendChild(createFaceElement("B"));

  // Row 3: empty, D, empty, empty
  const row3 = document.createElement("div");
  row3.className = "cube-row";
  row3.appendChild(createSpacer());
  row3.appendChild(createFaceElement("D"));
  row3.appendChild(createSpacer());
  row3.appendChild(createSpacer());

  net.appendChild(row1);
  net.appendChild(row2);
  net.appendChild(row3);

  cubeContainer.appendChild(net);
}

/**
 * Create an empty spacer cell in the net.
 */
function createSpacer() {
  const spacer = document.createElement("div");
  spacer.className = "face spacer";
  return spacer;
}

// =========================
// Event handlers
// =========================

/**
 * Handle clicking on a tile: paint it with currentColor.
 */
function onTileClick(e) {
  const tile = e.currentTarget;
  const idx = parseInt(tile.dataset.globalIndex, 10);
  if (!currentColor) {
    // No color selected; do nothing.
    return;
  }
  cubeState[idx] = currentColor;
  tile.style.backgroundColor = getTileColor(currentColor);
  refreshStateOutput();
}

/**
 * Handle clicking on a palette button.
 */
function onPaletteClick(e) {
  const btn = e.currentTarget;
  const color = btn.dataset.color;
  setCurrentColor(color);
}

/**
 * Handle keydown for arrow keys to move cube container.
 */
function onKeyDown(e) {
  const key = e.key;
  const step = 20; // pixels per key press

  if (key === "ArrowLeft") {
    // move cube right
    cubeOffsetX += step;
    applyCubeTransform();
  } else if (key === "ArrowRight") {
    // move cube left
    cubeOffsetX -= step;
    applyCubeTransform();
  } else if (key === "ArrowUp") {
    // move cube down
    cubeOffsetY += step;
    applyCubeTransform();
  } else if (key === "ArrowDown") {
    // move cube up
    cubeOffsetY -= step;
    applyCubeTransform();
  }
}

/**
 * Copy state string to clipboard.
 */
function onCopyState() {
  const text = stateOutput.value;
  if (!navigator.clipboard) {
    // Fallback
    stateOutput.select();
    document.execCommand("copy");
    return;
  }
  navigator.clipboard.writeText(text).catch(() => {
    stateOutput.select();
    document.execCommand("copy");
  });
}

/**
 * Handle clicking the Solve button.
 * This is a toy solver: it doesn't really solve the cube,
 * but it mimics the API-style response.
 */
function onSolveClick() {
  const encoded = encodeCubeStateToDigits();

  // In a real app, you'd send `encoded` to a solver.
  // Here we generate a simple, deterministic "fake" sequence
  // based on the encoded string so it feels responsive.

  const moves = generateToySolution(encoded);

  const response = {
    status: "success",
    moves: moves,
  };

  solverResult.textContent = JSON.stringify(response);
}

// =========================
// Toy "solver" logic
// =========================

/**
 * Generate a toy move sequence based on the encoded state string.
 * This is NOT a real solver; it's just to demonstrate the idea.
 *
 * We'll:
 *  - Count how many of each digit appear.
 *  - Use that to pick some moves from a small library.
 */
function generateToySolution(encoded) {
  const counts = {
    "0": 0,
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };

  for (let i = 0; i < encoded.length; i++) {
    const ch = encoded[i];
    if (counts.hasOwnProperty(ch)) {
      counts[ch]++;
    }
  }

  // Simple library of move snippets
  const snippets = [
    "R U R' U'",
    "L' U' L U",
    "F R U R' U' F'",
    "R U2 R' U'",
    "U R U' R'",
    "B' D' B D",
    "D R' D' R",
    "U2 F U F'",
    "R' F R F'",
    "L F' L' F",
  ];

  // Use counts to pick 3 snippets
  const total = counts["0"] + counts["1"] + counts["2"] + counts["3"] + counts["4"] + counts["5"];
  const idx1 = total % snippets.length;
  const idx2 = (counts["1"] + counts["3"]) % snippets.length;
  const idx3 = (counts["2"] + counts["4"] + counts["5"]) % snippets.length;

  const chosen = [snippets[idx1], snippets[idx2], snippets[idx3]];

  // Join them with spaces and compress a bit
  const moves = chosen.join(" ").replace(/\s+/g, " ").trim();
  return moves;
}

// =========================
// Initialization
// =========================

function initPalette() {
  paletteButtons.forEach((btn) => {
    btn.addEventListener("click", onPaletteClick);
  });
  // Default selected color: Front (green)
  setCurrentColor("F");
}

function initKeyboard() {
  document.addEventListener("keydown", onKeyDown);
}

function initStatePanel() {
  refreshStateOutput();
  copyStateBtn.addEventListener("click", onCopyState);
}

function initSolverPanel() {
  solveBtn.addEventListener("click", onSolveClick);
}

function init() {
  buildCubeUI();
  initPalette();
  initKeyboard();
  initStatePanel();
  initSolverPanel();
  applyCubeTransform();
}

document.addEventListener("DOMContentLoaded", init);
