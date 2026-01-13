// ----------------------
// Firebase Imports
// ----------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { 
  getAuth, 
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// ----------------------
// Firebase Config
// ----------------------
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

// ----------------------
// UI Elements
// ----------------------
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const googleBtn = document.getElementById("googleBtn");
const message = document.getElementById("message");

// ----------------------
// Human-Friendly Errors
// ----------------------
function friendlyError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/missing-email":
      return "Please enter an email address.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/user-not-found":
      return "No account found with that email.";
    default:
      return "Something went wrong. Try again.";
  }
}

// ----------------------
// SIGN UP
// ----------------------
signupBtn.onclick = () => {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "/dashboard/";
    })
    .catch(err => message.textContent = friendlyError(err.code));
};

// ----------------------
// LOGIN
// ----------------------
loginBtn.onclick = () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const remember = document.getElementById("rememberMe").checked;

  const persistence = remember ? browserLocalPersistence : browserSessionPersistence;

  setPersistence(auth, persistence)
    .then(() => signInWithEmailAndPassword(auth, email, password))
    .then(() => {
      window.location.href = "/dashboard/";
    })
    .catch(err => message.textContent = friendlyError(err.code));
};

// ----------------------
// GOOGLE SIGN-IN
// ----------------------
const provider = new GoogleAuthProvider();

googleBtn.onclick = () => {
  signInWithPopup(auth, provider)
    .then(() => {
      window.location.href = "/dashboard/";
    })
    .catch(err => message.textContent = friendlyError(err.code));
};

// ----------------------
// CONTENTEDITABLE PROTECTION
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

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

  observer.observe(body, {
    attributes: true,
    attributeFilter: ["contenteditable"]
  });

  const initial = body.getAttribute("contenteditable");
  if (initial && initial.toLowerCase() === "true") {
    body.setAttribute("contenteditable", "false");
    alert("Don't try to edit my page! ~Suomynona589");
  }
});
