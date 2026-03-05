const SAVE_KEY = "infinite-craft-data";
let dataStore = null;
let elements = [];
let placed = [];
let dragging = null;
let floating = null;

fetch("data.json")
  .then(r => r.json())
  .then(j => {
    dataStore = j;
    load();
    renderSidebar();
  });

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    elements = dataStore.base.map(e => ({ text: e.text, emoji: e.emoji, discovered: false }));
    save();
    return;
  }
  elements = JSON.parse(raw).elements;
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ elements }));
}

function renderSidebar() {
  const sb = document.getElementById("sidebar");
  sb.innerHTML = "";
  elements.forEach(e => {
    const el = document.createElement("div");
    el.className = "sidebar-item";
    el.dataset.text = e.text;
    el.dataset.emoji = e.emoji;
    el.innerHTML = `<span class="emoji">${e.emoji}</span><span class="label">${e.text}</span>`;
    el.addEventListener("mousedown", ev => startDragSidebar(ev, e));
    sb.appendChild(el);
  });
}

function startDragSidebar(ev, item) {
  dragging = { source: "sidebar", text: item.text, emoji: item.emoji };
  createFloating(ev.clientX, ev.clientY, item);
}

function createFloating(x, y, item) {
  removeFloating();
  floating = document.createElement("div");
  floating.className = "item floating";
  floating.innerHTML = `<span class="emoji">${item.emoji}</span><span class="label">${item.text}</span>`;
  document.body.appendChild(floating);
  moveFloating(x, y);
}

function moveFloating(x, y) {
  if (!floating) return;
  floating.style.left = x + "px";
  floating.style.top = y + "px";
  highlightMix(x, y);
}

function removeFloating() {
  if (floating) floating.remove();
  floating = null;
  clearMix();
}

document.addEventListener("mousemove", ev => {
  if (dragging) moveFloating(ev.clientX, ev.clientY);
});

document.addEventListener("mouseup", ev => {
  if (!dragging) return;
  const hit = findOverlap(ev.clientX, ev.clientY);
  if (hit) mix(hit, dragging, ev.clientX, ev.clientY);
  else place(ev.clientX, ev.clientY, dragging.emoji, dragging.text);
  removeFloating();
  dragging = null;
});

function place(x, y, emoji, text) {
  const c = document.getElementById("canvas");
  const el = document.createElement("div");
  el.className = "item placed";
  el.dataset.text = text;
  el.dataset.emoji = emoji;
  el.innerHTML = `<span class="emoji">${emoji}</span><span class="label">${text}</span>`;
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.addEventListener("mousedown", ev => startDragPlaced(ev, el));
  c.appendChild(el);
  placed.push(el);
}

function startDragPlaced(ev, el) {
  dragging = { source: "placed", text: el.dataset.text, emoji: el.dataset.emoji, element: el };
  el.remove();
  placed = placed.filter(p => p !== el);
  createFloating(ev.clientX, ev.clientY, dragging);
}

function findOverlap(x, y) {
  return placed.find(el => {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  });
}

function highlightMix(x, y) {
  clearMix();
  const hit = findOverlap(x, y);
  if (hit && floating) {
    hit.classList.add("mix-hover");
    floating.classList.add("mix-hover");
  }
}

function clearMix() {
  placed.forEach(el => el.classList.remove("mix-hover"));
  if (floating) floating.classList.remove("mix-hover");
}

function mix(target, dragged, x, y) {
  const key1 = dragged.text + "+" + target.dataset.text;
  const key2 = target.dataset.text + "+" + dragged.text;
  const recipe = dataStore.recipes[key1] || dataStore.recipes[key2];
  target.remove();
  placed = placed.filter(p => p !== target);
  if (!recipe) {
    place(x, y, dragged.emoji, dragged.text);
    return;
  }
  place(x, y, recipe.emoji, recipe.text);
  const exists = elements.find(e => e.text === recipe.text);
  if (!exists) {
    elements.push({ text: recipe.text, emoji: recipe.emoji, discovered: true });
    save();
    renderSidebar();
  }
}

document.getElementById("clear-canvas").addEventListener("click", () => {
  document.getElementById("canvas").innerHTML = "";
  placed = [];
});

document.getElementById("reset").addEventListener("click", () => {
  elements = dataStore.base.map(e => ({ text: e.text, emoji: e.emoji, discovered: false }));
  save();
  renderSidebar();
  document.getElementById("canvas").innerHTML = "";
  placed = [];
});
