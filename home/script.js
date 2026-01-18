import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
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

const ADMIN_EMAIL = "suomynona589@gmail.com";

const userInfoEl = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");
const builderBtn = document.getElementById("builderBtn");

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.removeItem("loggedIn");
  window.location.href = "/";
});

builderBtn.addEventListener("click", () => {
  window.location.href = "/builder/";
});

async function loadHighScores() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "scores", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  if (data.score_hoo) {
    const { correct, total } = data.score_hoo;
    const percent = Math.round((correct / total) * 100);
    const el = document.getElementById("score-hoo");
    if (el) el.textContent = `Your high score: ${percent}%`;
  }

  if (data.score_kc) {
    const { correct, total } = data.score_kc;
    const percent = Math.round((correct / total) * 100);
    const el = document.getElementById("score-kc");
    if (el) el.textContent = `Your high score: ${percent}%`;
  }

  if (data.score_hp) {
    const { correct, total } = data.score_hp;
    const percent = Math.round((correct / total) * 100);
    const el = document.getElementById("score-hp");
    if (el) el.textContent = `Your high score: ${percent}%`;
  }

  if (data.score_pjo) {
    const { correct, total } = data.score_pjo;
    const percent = Math.round((correct / total) * 100);
    const el = document.getElementById("score-pjo");
    if (el) el.textContent = `Your high score: ${percent}%`;
  }
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/login/";
    return;
  }

  const email = user.isAnonymous ? "anonymous" : user.email;
  userInfoEl.textContent = `Signed in as ${email}`;

  if (email === ADMIN_EMAIL) {
    builderBtn.classList.remove("admin-only");
  }

  loadHighScores();
});
