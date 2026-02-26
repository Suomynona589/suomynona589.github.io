document.getElementById("sendTest").onclick = () => {
  const payload = {
    phase: "night",
    role: "mafia",
    alivePlayers: ["A", "B", "C"],
    self: "A",
    nightNumber: 1
  };

  fetch("https://hook.us2.make.com/mqrm50o1w5qevmcihcy2r87zmt9sreie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.text())
  .then(text => {
    document.getElementById("output").textContent = text;
  })
  .catch(err => {
    document.getElementById("output").textContent = "Error: " + err;
  });
};
