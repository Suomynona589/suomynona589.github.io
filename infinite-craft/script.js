const SAVE_KEY = "infinite-craft-save";
let dataStore = null;
let discovered = [];
let placedElements = [];
let dragging = null;
let floatingEl = null;

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
    node.dataset.id = it.id;
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
    id: item.id
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
  highlightMix(x, y);
}

function removeFloating() {
  if (floatingEl && floatingEl.parentNode) floatingEl.parentNode.removeChild(floatingEl);
  floatingEl = null;
  clearMixHighlights();
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
      placeOnCanvas(ev.clientX, ev.clientY, dragging.emoji, dragging.text, dragging.id);
    }
  } else if (dragging.source === "placed") {
    if (!overSidebar) {
      const hit = findOverlapWithPlaced(ev.clientX, ev.clientY);
      if (hit) {
        combineElements(hit, dragging, ev.clientX, ev.clientY);
      } else {
        placeOnCanvas(ev.clientX, ev.clientY, dragging.emoji, dragging.text, dragging.id);
      }
    }
  }
  removeFloating();
  dragging = null;
});

function placeOnCanvas(x, y, emoji, text, id) {
  const canvas = document.getElementById("canvas");
  const el = document.createElement("div");
  el.className = "item placed";
  el.dataset.emoji = emoji;
  el.dataset.text = text;
  el.dataset.id = id;
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
    id: el.dataset.id,
    element: el
  };
  el.parentNode.removeChild(el);
  const idx = placedElements.indexOf(el);
  if (idx !== -1) placedElements.splice(idx, 1);
  createFloating(ev.clientX, ev.clientY, { emoji: dragging.emoji, text: dragging.text });
}

function findOverlapWithPlaced(x, y) {
  for (let el of placedElements) {
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el;
  }
  return null;
}

function highlightMix(x, y) {
  clearMixHighlights();
  for (let el of placedElements) {
    const r = el.getBoundingClientRect();
    const touching = !(x < r.left - 20 || x > r.right + 20 || y < r.top - 20 || y > r.bottom + 20);
    if (touching) {
      el.classList.add("mix-hover");
      if (floatingEl) floatingEl.classList.add("mix-hover");
      return;
    }
  }
}

function clearMixHighlights() {
  placedElements.forEach(el => el.classList.remove("mix-hover"));
  if (floatingEl) floatingEl.classList.remove("mix-hover");
}

function combineElements(targetEl, dragged, x, y) {
  const a = targetEl.dataset.id;
  const b = dragged.id;
  const recipe = dataStore.recipes[`${a}+${b}`] || dataStore.recipes[`${b}+${a}`];
  if (!recipe) {
    placeOnCanvas(x, y, dragged.emoji, dragged.text, dragged.id);
    return;
  }
  targetEl.parentNode.removeChild(targetEl);
  const idx = placedElements.indexOf(targetEl);
  if (idx !== -1) placedElements.splice(idx, 1);
  placeOnCanvas(x, y, recipe.emoji, recipe.text, recipe.id);
  if (!discovered.find(d => d.text === recipe.text)) {
    discovered.push({ id: recipe.id, emoji: recipe.emoji, text: recipe.text });
    save();
    renderSidebar();
  }
}

document.getElementById("reset").addEventListener("click", () => {
  discovered = [];
  save();
  renderSidebar();
  const canvas = document.getElementById("canvas");
  canvas.innerHTML = "";
  placedElements = [];
});

const clearIcon = document.createElement("img");
clearIcon.id = "clear-canvas";
clearIcon.src = "https://neal.fun/infinite-craft/clear.svg";
document.body.appendChild(clearIcon);

clearIcon.addEventListener("click", () => {
  const canvas = document.getElementById("canvas");
  canvas.innerHTML = "";
  placedElements = [];
});
