let history = [];

document.getElementById("send").onclick = async () => {
  const prompt = document.getElementById("input").value;

  // Add user message to history WITH content
  history.push({
    role: "user",
    content: prompt
  });

  const response = await fetch("https://mafia-backend-hmsj.onrender.com/api/mafia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history })
  });

  const data = await response.json();

  // If backend returned an error
  if (data.error) {
    document.getElementById("output").innerText =
      "Backend error:\n" + JSON.stringify(data.error, null, 2);
    return;
  }

  const reply = data.choices[0].message.content;

  // Add assistant reply to history WITH content
  history.push({
    role: "assistant",
    content: reply
  });

  // Display the reply
  document.getElementById("output").innerText += "\nAI: " + reply + "\n";
};
