if (!localStorage.getItem("connected-to-bot")) {
    location.href = "..";
}

const content = document.getElementById("content");
const eventsBtn = document.getElementById("events-btn");

function loadEvents() {
    const data = localStorage.getItem("eventListeners");
    content.innerHTML = "";

    if (!data) {
        const wrap = document.createElement("div");
        wrap.id = "empty-wrap";

        const msg = document.createElement("div");
        msg.id = "empty-msg";
        msg.textContent = "No event listeners created.";

        const btn = document.createElement("button");
        btn.id = "create-event-btn";
        btn.textContent = "Create Event Listener";

        wrap.appendChild(msg);
        wrap.appendChild(btn);
        content.appendChild(wrap);
        return;
    }
}

eventsBtn.onclick = loadEvents;
loadEvents();
