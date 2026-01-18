import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDHKqrPamXSvMI9U8L1ZWrE-WL8ltj3EY",
  authDomain: "suomynona589-github-io.firebaseapp.com",
  projectId: "suomynona589-github-io",
  storageBucket: "suomynona589-github-io.firebasestorage.app",
  messagingSenderId: "1048880083720",
  appId: "1:1048880083720:web:fc2b84d1dcfbb8d36c32bd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

async function finishQuiz() {
  const user = auth.currentUser;

  if (user) {
    const scoreData = {
      correct: score,
      total: quizData.questions.length,
      updated: Date.now()
    };

    try {
      await setDoc(
        doc(db, "scores", user.uid),
        { score_pjo: scoreData },
        { merge: true }
      );
    } catch (err) {
      console.error("Error saving score:", err);
    }
  }

  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").textContent =
    `You scored ${score} out of ${quizData.questions.length}`;
}

loadQuiz();
