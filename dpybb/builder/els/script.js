if (!localStorage.getItem("connected-to-bot")) {
    location.href = "..";
}

function getId() {
    const p = new URLSearchParams(location.search);
    return p.get("id");
}

const id = getId();

if (!id) {
    location.href = "..";
}

const key = "el-" + id;
let val = localStorage.getItem(key);

if (!val) {
    val = "default";
    localStorage.setItem(key, "default");
}

const header = document.getElementById("els-header");
const block = document.getElementById("els-block");

header.textContent = "Event Listener: " + id;

block.innerHTML = "";

const card = document.createElement("div");
card.id = "els-main-block";

const title = document.createElement("div");
title.id = "els-main-title";
title.textContent = id;

card.appendChild(title);
block.appendChild(card);
