let quizData = null;
let current = 0;
let score = 0;

async function loadQuiz() {
  const res = await fetch("data.json");
  quizData = await res.json();
  document.getElementById("title").textContent = quizData.title;
  showQuestion();
}

function showQuestion() {
  const q = quizData.questions[current];
  document.getElementById("question").textContent = q.q;

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => selectAnswer(i);
    choicesDiv.appendChild(btn);
  });
}

function selectAnswer(i) {
  const correct = quizData.questions[current].answer;
  if (i === correct) score++;

  current++;

  if (current >= quizData.questions.length) {
    finishQuiz();
  } else {
    showQuestion();
  }
}

function finishQuiz() {
  localStorage.setItem("score_kc", JSON.stringify({
    correct: score,
    total: quizData.questions.length
  }));

  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").textContent =
    `You scored ${score} out of ${quizData.questions.length}`;
}

loadQuiz();
