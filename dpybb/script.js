if (localStorage.getItem("connected-to-bot") === "true") {
    location.href = "builder";
}

window.onload = function () {
    const btn = document.getElementById("submit");
    const token = document.getElementById("token");

    btn.onclick = function () {
        let t = token.value;
        if (t.length < 10) return;
        localStorage.setItem("bot-token", t);
        localStorage.setItem("connected-to-bot", "true");
        location.href = "builder";
    };
};
