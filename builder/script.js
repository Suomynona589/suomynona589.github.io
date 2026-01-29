import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDHKqrPamXSvMI9U8L1ZWrE-WL8ltj3EY",
  authDomain: "suomynona589-github-io.firebaseapp.com",
  projectId: "suomynona589-github-io",
  storageBucket: "suomynona589-github-io.firebasestorage.app",
  messagingSenderId: "1048880083720",
  appId: "1:1048880083720:web:fc2b84d1dcfbb8d36c32bd"
};

const ADMIN_EMAIL = "suomynona589@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

emailjs.init("GoREpH1TXayH6G9Tw");

const userInfoEl = document.getElementById("userInfo");
const blockedOverlay = document.getElementById("blockedOverlay");
const goHomeBtn = document.getElementById("goHomeBtn");
const backBtn = document.getElementById("backBtn");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const sendBtn = document.getElementById("sendBtn");
const questionsContainer = document.getElementById("questionsContainer");
const statusEl = document.getElementById("status");
const quizTitleInput = document.getElementById("quizTitle");
const nicknameInput = document.getElementById("nickname");
const imageNicknameInput = document.getElementById("imageNickname");
const quizNumberInput = document.getElementById("quizNumber");

goHomeBtn.addEventListener("click", () => {
  window.location.href = "/home/";
});

backBtn.addEventListener("click", () => {
  window.location.href = "/home/";
});

function setStatus(msg, ok = false) {
  statusEl.textContent = msg || "";
  statusEl.className = "status " + (ok ? "ok" : "err");
}

function createQuestionCard(index) {
  const card = document.createElement("div");
  card.className = "question-card";

  const header = document.createElement("div");
  header.className = "question-header";

  const title = document.createElement("div");
  title.className = "question-title";
  title.textContent = `Question ${index + 1}`;

  const headerButtons = document.createElement("div");

  const addChoiceBtn = document.createElement("button");
  addChoiceBtn.type = "button";
  addChoiceBtn.className = "btn btn-secondary btn-small";
  addChoiceBtn.textContent = "+ Choice";

  const removeChoiceBtn = document.createElement("button");
  removeChoiceBtn.type = "button";
  removeChoiceBtn.className = "btn btn-secondary btn-small";
  removeChoiceBtn.textContent = "− Choice";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-danger btn-small";
  deleteBtn.textContent = "Delete question";

  headerButtons.appendChild(addChoiceBtn);
  headerButtons.appendChild(removeChoiceBtn);
  headerButtons.appendChild(deleteBtn);

  header.appendChild(title);
  header.appendChild(headerButtons);

  const questionLabel = document.createElement("label");
  questionLabel.textContent = "Question text";

  const questionInput = document.createElement("input");
  questionInput.type = "text";
  questionInput.placeholder = "e.g. What is the fastest land animal?";

  const choicesWrapper = document.createElement("div");
  choicesWrapper.className = "choices-row";

  const correctSelect = document.createElement("select");

  function rebuildCorrectOptions() {
    const choiceInputs = choicesWrapper.querySelectorAll("input[type='text']");
    const prevIndex = correctSelect.value !== "" ? parseInt(correctSelect.value, 10) : 0;
    correctSelect.innerHTML = "";
    choiceInputs.forEach((_, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `Correct answer: Choice ${i + 1}`;
      correctSelect.appendChild(opt);
    });
    if (choiceInputs.length > 0) {
      const safeIndex = Math.min(prevIndex, choiceInputs.length - 1);
      correctSelect.value = String(safeIndex);
    }
  }

  function addChoice(initialText = "") {
    const currentCount = choicesWrapper.querySelectorAll(".choice-line").length;
    if (currentCount >= 6) return;

    const line = document.createElement("div");
    line.className = "choice-line";

    const label = document.createElement("div");
    label.className = "choice-label";
    label.textContent = String.fromCharCode(65 + currentCount) + ".";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Choice ${currentCount + 1}`;
    input.value = initialText;

    line.appendChild(label);
    line.appendChild(input);
    choicesWrapper.appendChild(line);

    rebuildCorrectOptions();
  }

  function removeChoice() {
    const lines = choicesWrapper.querySelectorAll(".choice-line");
    if (lines.length <= 2) return;
    choicesWrapper.removeChild(lines[lines.length - 1]);
    rebuildCorrectOptions();
  }

  addChoiceBtn.addEventListener("click", () => addChoice());
  removeChoiceBtn.addEventListener("click", () => removeChoice());
  deleteBtn.addEventListener("click", () => {
    questionsContainer.removeChild(card);
    renumberQuestions();
  });

  addChoice();
  addChoice();
  addChoice();
  addChoice();

  const correctLabel = document.createElement("label");
  correctLabel.textContent = "Correct answer";

  rebuildCorrectOptions();

  card.appendChild(header);
  card.appendChild(questionLabel);
  card.appendChild(questionInput);
  card.appendChild(choicesWrapper);
  card.appendChild(correctLabel);
  card.appendChild(correctSelect);

  return card;
}

function renumberQuestions() {
  const cards = questionsContainer.querySelectorAll(".question-card");
  cards.forEach((card, i) => {
    const title = card.querySelector(".question-title");
    if (title) title.textContent = `Question ${i + 1}`;
  });
}

addQuestionBtn.addEventListener("click", () => {
  const index = questionsContainer.querySelectorAll(".question-card").length;
  const card = createQuestionCard(index);
  questionsContainer.appendChild(card);
  renumberQuestions();
});

function collectQuizData() {
  const title = quizTitleInput.value.trim();
  if (!title) throw new Error("Enter a quiz title.");

  const nickname = nicknameInput.value.trim();
  if (!nickname) throw new Error("Enter a nickname (e.g. pjo).");
  if (nickname.length > 5) throw new Error("Nickname must be at most 5 characters.");

  const imageNickname = imageNicknameInput.value.trim();
  if (!imageNickname) throw new Error("Enter an image nickname (e.g. PJO).");
  if (imageNickname.length > 5) throw new Error("Image nickname must be at most 5 characters.");

  const quizNumber = quizNumberInput.value.trim();
  if (!quizNumber) throw new Error("Enter a quiz number (e.g. 6).");

  const cards = questionsContainer.querySelectorAll(".question-card");
  if (cards.length === 0) throw new Error("Add at least one question.");

  const questions = [];

  cards.forEach((card, idx) => {
    const questionInput = card.querySelector("input[type='text']");
    const choicesInputs = card.querySelectorAll(".choices-row input[type='text']");
    const correctSelect = card.querySelector("select");

    const qText = questionInput.value.trim();
    if (!qText) throw new Error(`Question ${idx + 1} is empty.`);

    const choices = [];
    choicesInputs.forEach((input, i) => {
      const val = input.value.trim();
      if (!val) throw new Error(`Question ${idx + 1}, choice ${i + 1} is empty.`);
      choices.push(val);
    });

    if (choices.length < 2 || choices.length > 5)
      throw new Error(`Question ${idx + 1} must have between 2 and 5 choices.`);

    const answerIndex = parseInt(correctSelect.value, 10);
    if (isNaN(answerIndex) || answerIndex < 0 || answerIndex >= choices.length)
      throw new Error(`Question ${idx + 1} has an invalid correct answer index.`);

    questions.push({ q: qText, choices, answer: answerIndex });
  });

  return {
    title,
    nickname,
    imageNickname,
    quizNumber,
    questions
  };
}

sendBtn.addEventListener("click", async () => {
  setStatus("");

  let data;
  try {
    data = collectQuizData();
  } catch (err) {
    setStatus(err.message || "Invalid quiz data.", false);
    return;
  }

  const jsonPayload = {
    title: `${data.title} Quiz`,
    questions: data.questions
  };

  const jsonString = JSON.stringify(jsonPayload, null, 2);

  try {
    const result = await emailjs.send("service_bdzvpui", "template_q4r5d3d", {
      quiz_title: data.title,
      nickname: data.nickname,
      image_nickname: data.imageNickname,
      quiz_number: data.quizNumber,
      json: jsonString
    });

    console.log("EmailJS success:", result);
    setStatus("Sent! Check your email for the quiz JSON and code blocks.", true);

  } catch (err) {
    console.error("EmailJS error:", err);
    setStatus("Failed to send email: " + (err.message || err), false);
  }
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/";
    return;
  }

  const email = user.email || "(anonymous)";
  userInfoEl.textContent = `Signed in as ${email}`;

  if (email !== ADMIN_EMAIL) {
    document.body.innerHTML = `
      <p>Quiz Builder is not yet available for regular users</p>
      <button id="goHomeBtn" class="btn btn-secondary" style="margin-top:10px;">Back to home</button>
    `;
    document.getElementById("goHomeBtn").onclick = () => {
      window.location.href = "/home/";
    };
    return;
  }

  if (questionsContainer.querySelectorAll(".question-card").length === 0) {
    const card = createQuestionCard(0);
    questionsContainer.appendChild(card);
  }
});
