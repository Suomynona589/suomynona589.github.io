const SAVE_KEY = "infinite-craft-save";
let dataStore = null;
let discovered = [];
let placedElements = [];
let dragging = null;
let floatingEl = null;
let dragOffset = { x: 0, y: 0 };

fetch("data.json")
  .then(r => r.json())
  .then(j => {
    dataStore = j;
    loadSave();
    renderSidebar();
  });

function loadSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    discovered = [];
    save();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    discovered = Array.isArray(parsed.discovered) ? parsed.discovered : [];
  } catch (e) {
    discovered = [];
    save();
  }
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ discovered }));
}

function allSidebarItems() {
  return dataStore.base.concat(discovered);
}

function renderSidebar() {
  const sb = document.getElementById("sidebar");
  sb.innerHTML = "";
  allSidebarItems().forEach((it, idx) => {
    const node = document.createElement("div");
    node.className = "sidebar-item";
    node.dataset.index = idx;
    node.dataset.emoji = it.emoji;
    node.dataset.text = it.text;
    node.dataset.code = it.code || "";
    node.innerHTML = `<span class="emoji">${it.emoji}</span><span class="label">${it.text}</span>`;
    node.addEventListener("mousedown", ev => {
      ev.preventDefault();
      startDragFromSidebar(ev, it);
    });
    sb.appendChild(node);
  });
}

function startDragFromSidebar(ev, item) {
  dragging = {
    source: "sidebar",
    emoji: item.emoji,
    text: item.text,
    code: item.code || "",
    original: item
  };
  createFloating(ev.clientX, ev.clientY, item);
}

function createFloating(x, y, item) {
  removeFloating();
  floatingEl = document.createElement("div");
  floatingEl.className = "item floating";
  floatingEl.innerHTML = `<span class="emoji">${item.emoji}</span><span class="label">${item.text}</span>`;
  document.body.appendChild(floatingEl);
  moveFloating(x, y);
}

function moveFloating(x, y) {
  if (!floatingEl) return;
  floatingEl.style.left = `${x - 40}px`;
  floatingEl.style.top = `${y - 20}px`;
}

function removeFloating() {
  if (floatingEl && floatingEl.parentNode) floatingEl.parentNode.removeChild(floatingEl);
  floatingEl = null;
}

document.addEventListener("mousemove", ev => {
  if (!dragging) return;
  moveFloating(ev.clientX, ev.clientY);
});

document.addEventListener("mouseup", ev => {
  if (!dragging) return;
  const sb = document.getElementById("sidebar");
  const sbRect = sb.getBoundingClientRect();
  const overSidebar = ev.clientX >= sbRect.left;
  if (dragging.source === "sidebar") {
    if (!overSidebar) {
      placeOnCanvas(ev.clientX, ev.clientY, dragging.emoji, dragging.text, dragging.code);
    }
  } else if (dragging.source === "placed") {
    if (overSidebar) {
      // dropping back into sidebar deletes the placed element (already removed when drag started)
    } else {
      const hit = findOverlapWithPlaced(ev.clientX, ev.clientY);
      if (hit) {
        combineElements(hit, { emoji: dragging.emoji, text: dragging.text, code: dragging.code }, ev.clientX, ev.clientY);
      } else {
        placeOnCanvas(ev.clientX, ev.clientY, dragging.emoji, dragging.text, dragging.code);
      }
    }
  }
  removeFloating();
  dragging = null;
});

function placeOnCanvas(x, y, emoji, text, code) {
  const canvas = document.getElementById("canvas");
  const el = document.createElement("div");
  el.className = "item placed";
  el.dataset.emoji = emoji;
  el.dataset.text = text;
  el.dataset.code = code || "";
  el.innerHTML = `<span class="emoji">${emoji}</span><span class="label">${text}</span>`;
  el.style.left = `${x - 40}px`;
  el.style.top = `${y - 20}px`;
  el.addEventListener("mousedown", ev => {
    ev.preventDefault();
    startDragPlaced(ev, el);
  });
  canvas.appendChild(el);
  placedElements.push(el);
}

function startDragPlaced(ev, el) {
  const rect = el.getBoundingClientRect();
  dragging = {
    source: "placed",
    emoji: el.dataset.emoji,
    text: el.dataset.text,
    code: el.dataset.code,
    element: el
  };
  dragOffset.x = ev.clientX - rect.left;
  dragOffset.y = ev.clientY - rect.top;
  el.parentNode.removeChild(el);
  const idx = placedElements.indexOf(el);
  if (idx !== -1) placedElements.splice(idx, 1);
  createFloating(ev.clientX, ev.clientY, { emoji: dragging.emoji, text: dragging.text });
}

function rectsIntersect(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function findOverlapWithPlaced(x, y) {
  for (let el of placedElements) {
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el;
  }
  return null;
}

function combineElements(targetEl, dragged, x, y) {
  const aCode = targetEl.dataset.code || codeFromText(targetEl.dataset.text);
  const bCode = dragged.code || codeFromText(dragged.text);
  const key1 = `${aCode}+${bCode}`;
  const key2 = `${bCode}+${aCode}`;
  const recipe = dataStore.recipes[key1] || dataStore.recipes[key2];
  if (!recipe) {
    placeOnCanvas(x, y, dragged.emoji, dragged.text, dragged.code);
    return;
  }
  const targetRect = targetEl.getBoundingClientRect();
  const draggedRect = {
    left: x - 40,
    top: y - 20,
    right: x - 40 + targetRect.width,
    bottom: y - 20 + targetRect.height
  };
  const overlapX = Math.max(targetRect.left, draggedRect.left);
  const overlapY = Math.max(targetRect.top, draggedRect.top);
  targetEl.parentNode.removeChild(targetEl);
  const idx = placedElements.indexOf(targetEl);
  if (idx !== -1) placedElements.splice(idx, 1);
  placeOnCanvas(overlapX + 20, overlapY + 10, recipe.emoji, recipe.text, recipe.code);
  if (!discovered.find(d => d.text === recipe.text)) {
    discovered.push({ id: discovered.length + 5, emoji: recipe.emoji, text: recipe.text, code: recipe.code });
    save();
    renderSidebar();
  }
}

function codeFromText(text) {
  const all = allSidebarItems();
  const found = all.find(i => i.text === text);
  return found ? (found.code || "") : "";
}

document.getElementById("reset").addEventListener("click", () => {
  discovered = [];
  save();
  renderSidebar();
  const canvas = document.getElementById("canvas");
  canvas.innerHTML = "";
  placedElements = [];
});
