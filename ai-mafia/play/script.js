const settings = JSON.parse(localStorage.getItem("mafiaSettings"));
const playersDiv = document.getElementById("players");
const logDiv = document.getElementById("log");

function randomColor() {
  const letters = "0123456789ABCDEF";
  let c = "#";
  for (let i = 0; i < 6; i++) c += letters[Math.floor(Math.random() * 16)];
  return c;
}

function initials(name) {
  return name.substring(0, 3).toUpperCase();
}

function renderPlayers() {
  playersDiv.innerHTML = "";
  settings.names.forEach(name => {
    const div = document.createElement("div");
    div.className = "player";

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.style.background = randomColor();
    icon.textContent = initials(name);

    const label = document.createElement("span");
    label.textContent = name;

    div.appendChild(icon);
    div.appendChild(label);
    playersDiv.appendChild(div);
  });
}

function log(text) {
  logDiv.textContent += text + "\n";
}

renderPlayers();
log("Game loaded.");
