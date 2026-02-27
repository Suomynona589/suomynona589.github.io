const WEBHOOK_URL = "https://hook.us2.make.com/mqrm50o1w5qevmcihcy2r87zmt9sreie";

const names = [
  "Ava","Liam","Mia","Noah","Emma",
  "Lucas","Olivia","Ethan","Sophia","Mason"
];

const roles = [
  "detective",
  "doctor",
  "mafia",
  "mafia",
  "town",
  "town",
  "town",
  "town",
  "town",
  "town"
];

let players = [];
let nightNumber = 1;
let running = false;

const playersDiv = document.getElementById("players");
const logDiv = document.getElementById("log");
const phaseDiv = document.getElementById("phase");
const startBtn = document.getElementById("startGame");
const stopBtn = document.getElementById("stopGame");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function randomColor() {
  const letters = "0123456789ABCDEF";
  let c = "#";
  for (let i = 0; i < 6; i++) c += letters[Math.floor(Math.random() * 16)];
  return c;
}

function initials(name) {
  return name.substring(0, 3).toUpperCase();
}

function setupPlayers() {
  const shuffledNames = [...names];
  shuffle(shuffledNames);
  const shuffledRoles = [...roles];
  shuffle(shuffledRoles);
  players = shuffledNames.map((name, i) => ({
    id: "P" + (i + 1),
    name,
    role: shuffledRoles[i],
    alive: true,
    color: randomColor()
  }));
}

function renderPlayers() {
  playersDiv.innerHTML = "";
  players.forEach(p => {
    const div = document.createElement("div");
    div.className = "player";
    if (!p.alive) div.classList.add("dead");

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.style.background = p.color;
    icon.textContent = initials(p.name);

    const info = document.createElement("div");
    info.className = "info";

    const nameEl = document.createElement("div");
    nameEl.className = "name";
    nameEl.textContent = p.name;

    const roleEl = document.createElement("div");
    roleEl.className = "role";
    roleEl.textContent = p.role;

    info.appendChild(nameEl);
    info.appendChild(roleEl);

    div.appendChild(icon);
    div.appendChild(info);
    playersDiv.appendChild(div);
  });
}

function log(text) {
  logDiv.textContent += text + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
}

function setPhase(text) {
  phaseDiv.textContent = text;
}

function alivePlayers() {
  return players.filter(p => p.alive).map(p => p.name);
}

function callAI(player, phase, extra) {
  const payload = {
    gameId: "GAME1",
    playerId: player.id,
    playerName: player.name,
    role: player.role,
    phase,
    nightNumber,
    alivePlayers: alivePlayers(),
    self: player.name,
    extra
  };
  return fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  }).then(r => r.text());
}

function getRolePlayer(role) {
  return players.find(p => p.role === role && p.alive);
}

function getMafiaPlayers() {
  return players.filter(p => p.role === "mafia" && p.alive);
}

function randomAliveTarget(excludeName) {
  const list = players.filter(p => p.alive && p.name !== excludeName);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

async function nightPhase() {
  if (!running) return;
  setPhase("Night " + nightNumber);
  log("");
  log("Night " + nightNumber + " begins.");

  const detective = getRolePlayer("detective");
  const doctor = getRolePlayer("doctor");
  const mafias = getMafiaPlayers();

  let investigated = null;
  let protectedTarget = null;
  let killTarget = null;

  if (detective) {
    const target = randomAliveTarget(detective.name);
    investigated = target;
    await callAI(detective, "night_detective", {target: target ? target.name : null});
  }

  if (doctor) {
    const target = randomAliveTarget(null) || doctor;
    protectedTarget = target;
    await callAI(doctor, "night_doctor", {target: target ? target.name : null});
  }

  if (mafias.length) {
    const target = randomAliveTarget(null);
    killTarget = target;
    for (const m of mafias) {
      await callAI(m, "night_mafia", {target: target ? target.name : null});
    }
  }

  if (killTarget && protectedTarget && killTarget.name === protectedTarget.name) {
    log("Someone was attacked but survived.");
  } else if (killTarget) {
    killTarget.alive = false;
    log(killTarget.name + " was killed during the night.");
  } else {
    log("No one was killed during the night.");
  }

  if (investigated) {
    log("Detective secretly investigated " + investigated.name + ".");
  }

  renderPlayers();
  await new Promise(r => setTimeout(r, 1000));
  await dayPhase();
}

async function dayPhase() {
  if (!running) return;
  setPhase("Day " + nightNumber);
  log("Day " + nightNumber + " begins.");
  const alive = players.filter(p => p.alive);
  for (const p of alive) {
    await callAI(p, "day_talk", {});
  }
  const votes = {};
  for (const p of alive) {
    const target = randomAliveTarget(p.name);
    if (!target) continue;
    await callAI(p, "day_vote", {target: target.name});
    votes[target.name] = (votes[target.name] || 0) + 1;
  }
  let max = 0;
  let eliminatedName = null;
  Object.keys(votes).forEach(name => {
    if (votes[name] > max) {
      max = votes[name];
      eliminatedName = name;
    }
  });
  if (eliminatedName) {
    const elim = players.find(p => p.name === eliminatedName);
    if (elim) {
      elim.alive = false;
      log(elim.name + " was voted out.");
    }
  } else {
    log("No one was eliminated.");
  }
  renderPlayers();
  nightNumber += 1;
  await new Promise(r => setTimeout(r, 1000));
  if (running) await nightPhase();
}

function startGame() {
  if (running) return;
  running = true;
  nightNumber = 1;
  logDiv.textContent = "";
  setupPlayers();
  renderPlayers();
  nightPhase();
}

function stopGame() {
  running = false;
  setPhase("Stopped");
  log("Game stopped.");
}

startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);

setupPlayers();
renderPlayers();
setPhase("Ready");
log("Game ready. Press Start Game.");
