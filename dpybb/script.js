if (localStorage.getItem("connected-to-bot") === "true") {
    location.href = "/dpybb/builder";
}

document.getElementById("submit").onclick = function () {
    let t = document.getElementById("token").value;
    if (t.length < 10) return;
    localStorage.setItem("bot-token", t);
    localStorage.setItem("connected-to-bot", "true");
    location.href = "/dpybb/builder";
};
