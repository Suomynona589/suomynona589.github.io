    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
    import {
      getAuth,
      onAuthStateChanged,
      signOut
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

    const userInfoEl = document.getElementById("userInfo");
    const backBtn = document.getElementById("backBtn");
    const sendBtn = document.getElementById("sendBtn");
    const titleInput = document.getElementById("quizTitle");
    const codeInput = document.getElementById("quizCode");
    const statusEl = document.getElementById("status");

    backBtn.addEventListener("click", () => {
      window.location.href = "/quizzes/";
    });

    function setStatus(msg, ok = false) {
      statusEl.textContent = msg || "";
      statusEl.className = "status " + (ok ? "ok" : "err");
    }

    // Initialize EmailJS (replace with your public key)
    // You already have: emailjs.send("service_bdzvpui","template_q4r5d3d");
    // Here we just make sure the SDK is ready.
    emailjs.init("YOUR_PUBLIC_KEY_HERE");

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/";
        return;
      }
      const email = user.email || "(anonymous)";
      userInfoEl.textContent = `Signed in as ${email}`;

      if (email !== ADMIN_EMAIL) {
        // Not you → no access
        setStatus("You are not allowed to use the builder.", false);
        sendBtn.disabled = true;
      }
    });

    sendBtn.addEventListener("click", async () => {
      setStatus("");
      const title = titleInput.value.trim();
      const code = codeInput.value;

      if (!title) {
        setStatus("Enter a quiz title first.");
        return;
      }
      if (!code) {
        setStatus("Enter some quiz code first.");
        return;
      }

      try {
        await emailjs.send("service_bdzvpui", "template_q4r5d3d", {
          quiz_title: title,
          quiz_code: code
        });
        setStatus("Sent! Check your email for the quiz code.", true);
      } catch (err) {
        setStatus("Failed to send email: " + err.message);
      }
    });
