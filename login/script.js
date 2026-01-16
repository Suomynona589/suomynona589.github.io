import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
    import {
      getAuth,
      signInWithEmailAndPassword,
      signInWithPopup,
      GoogleAuthProvider,
      signInAnonymously,
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

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailBtn = document.getElementById("emailSignInBtn");
    const googleBtn = document.getElementById("googleSignInBtn");
    const anonBtn = document.getElementById("anonSignInBtn");
    const errorEl = document.getElementById("error");

    function showError(msg) {
      errorEl.textContent = msg || "";
    }

    emailBtn.addEventListener("click", async () => {
      showError("");
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        showError("Enter email and password.");
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "/home/";
      } catch (err) {
        showError(err.message);
      }
    });

    googleBtn.addEventListener("click", async () => {
      showError("");
      try {
        await signInWithPopup(auth, provider);
        window.location.href = "/home/";
      } catch (err) {
        showError(err.message);
      }
    });

    anonBtn.addEventListener("click", async () => {
      showError("");
      try {
        await signInAnonymously(auth);
        window.location.href = "/home/";
      } catch (err) {
        showError(err.message);
      }
    });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Already signed in → go straight to quizzes
        if (!window.location.pathname.startsWith("/home")) {
          window.location.href = "/home/";
        }
      }
    });
