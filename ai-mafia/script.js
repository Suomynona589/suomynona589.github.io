const defaultNames = [
  "Ava","Liam","Mia","Noah","Emma","Lucas","Olivia","Ethan",
  "Sophia","Mason","Isabella","Logan","Amelia","James","Harper",
  "Elijah","Evelyn","Benjamin","Abigail","Henry"
];

const playerCountInput = document.getElementById("playerCount");
const nameList = document.getElementById("nameList");
const startBtn = document.getElementById("startGame");

function generateNames(count) {
  const shuffled = [...defaultNames].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function renderNames() {
  const count = Number(playerCountInput.value);
  const names = generateNames(count);
  nameList.innerHTML = "";
  names.forEach((name, i) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = name;
    input.dataset.index = i;
    nameList.appendChild(input);
  });
}

startBtn.addEventListener("click", () => {
  const count = Number(playerCountInput.value);
  const inputs = [...nameList.querySelectorAll("input")];
  const names = inputs.map(i => i.value.trim() || "Player");
  const settings = {
    playerCount: count,
    names: names
  };
  localStorage.setItem("mafiaSettings", JSON.stringify(settings));
  const gameId = crypto.randomUUID();
  window.location.href = `/ai-mafia/play?game=${gameId}`;
});

playerCountInput.addEventListener("change", renderNames);

renderNames();
