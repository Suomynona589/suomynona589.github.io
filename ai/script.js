document.getElementById("send").onclick = async () => {
  const prompt = document.getElementById("input").value;

  const response = await fetch("https://mafia-backend-hmsj.onrender.com/api/mafia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();

  // If backend returned an error
  if (data.error) {
    document.getElementById("output").innerText =
      "Backend error: " + JSON.stringify(data.error, null, 2);
    return;
  }

  // If backend returned choices
  document.getElementById("output").innerText =
    data.choices[0].message.content;
};
