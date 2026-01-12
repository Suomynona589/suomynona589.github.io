import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { 
  getAuth, 
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCT8uB4fTOPFsTuVQfUkrI55247iKAxiLQ",
  authDomain: "sign-in-thing-7f106.firebaseapp.com",
  projectId: "sign-in-thing-7f106",
  storageBucket: "sign-in-thing-7f106.firebasestorage.app",
  messagingSenderId: "215017768496",
  appId: "1:215017768496:web:e71afda540582184bb8ff5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

signupBtn.onclick = () => {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => message.textContent = err.message);
};

loginBtn.onclick = () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const remember = document.getElementById("rememberMe").checked;

  const persistence = remember ? browserLocalPersistence : browserSessionPersistence;

  setPersistence(auth, persistence)
    .then(() => {
      return signInWithEmailAndPassword(auth, email, password);
    })
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => message.textContent = err.message);
};

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  // Create a MutationObserver to watch for attribute changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName.toLowerCase() === "contenteditable"
      ) {
        const current = body.getAttribute("contenteditable");

        if (current && current.toLowerCase() === "true") {
          body.setAttribute("contenteditable", "false");
          alert("Don't try to edit my page! ~Suomynona589");
        }
      }
    });
  });

  // Start observing the body for attribute changes
  observer.observe(body, {
    attributes: true,
    attributeFilter: ["contenteditable"]
  });

  // Also check immediately on load
  const initial = body.getAttribute("contenteditable");
  if (initial && initial.toLowerCase() === "true") {
    body.setAttribute("contenteditable", "false");
    alert("Don't try to edit my page! ~Suomynona589");
  }
});
