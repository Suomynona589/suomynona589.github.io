if (!localStorage.getItem("connected-to-bot")) {
    location.href = "..";
}

const content = document.getElementById("content");
const eventsBtn = document.getElementById("events-btn");

let popupMade = false;

function openCreatePopup() {
    if (!popupMade) {
        const overlay = document.createElement("div");
        overlay.id = "popup-overlay";

        const box = document.createElement("div");
        box.id = "popup-box";

        const title = document.createElement("div");
        title.id = "popup-title";
        title.textContent = "New Event Listener";

        const input = document.createElement("input");
        input.id = "popup-input";
        input.type = "text";
        input.placeholder = "Event listener name";

        const row = document.createElement("div");
        row.id = "popup-row";

        const cancel = document.createElement("button");
        cancel.id = "popup-cancel";
        cancel.textContent = "Cancel";

        const create = document.createElement("button");
        create.id = "popup-create";
        create.textContent = "Create";

        row.appendChild(cancel);
        row.appendChild(create);
        box.appendChild(title);
        box.appendChild(input);
        box.appendChild(row);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        cancel.onclick = function () {
            overlay.style.display = "none";
        };

        create.onclick = function () {
            const name = input.value.trim();
            if (!name) return;
            localStorage.setItem("el-" + name, "default");
            location.href = "els?id=" + encodeURIComponent(name);
        };

        popupMade = true;
    }

    const overlay = document.getElementById("popup-overlay");
    const input = document.getElementById("popup-input");
    overlay.style.display = "flex";
    input.value = "";
    input.focus();
}

function loadEvents() {
    const data = localStorage.getItem("eventListeners");
    content.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.id = "empty-wrap";

    const msg = document.createElement("div");
    msg.id = "empty-msg";

    const btn = document.createElement("button");
    btn.id = "create-event-btn";

    if (!data) {
        msg.textContent = "No event listeners created.";
        btn.textContent = "Create Event Listener";
        btn.onclick = openCreatePopup;
        wrap.appendChild(msg);
        wrap.appendChild(btn);
        content.appendChild(wrap);
        return;
    }
}

eventsBtn.onclick = loadEvents;
loadEvents();
