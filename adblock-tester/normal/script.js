document.addEventListener("DOMContentLoaded", () => {
    let answered = 0;
    let correct = 0;

    document.addEventListener("click", event => {
        const target = event.target;

        const isSee = target.classList.contains("see");
        const isNoSee = target.classList.contains("nosee");

        if (!isSee && !isNoSee) return;

        const box = target.closest(".test-box");
        if (!box || box.dataset.done) return;

        box.dataset.done = "1";
        answered++;

        const row = target.closest(".button-row");
        row.innerHTML = "";

        if (isNoSee) {
            correct++;
            const mark = document.createElement("div");
            mark.className = "result-mark";
            mark.style.color = "#2e7d32";
            mark.textContent = "✓";
            row.appendChild(mark);
        } else {
            const mark = document.createElement("div");
            mark.className = "result-mark";
            mark.style.color = "#c62828";
            mark.textContent = "✕";
            row.appendChild(mark);
        }

        if (answered === 5) {
            const percent = correct * 20;

            const popup = document.createElement("div");
            popup.className = "popup";
            popup.innerHTML = "You got " + percent + "%!<br>(" + correct + "/5)<br>";

            const btn = document.createElement("button");
            btn.textContent = "Try the extreme test?";
            btn.onclick = () => {
                window.location.href = "/adblock-tester/extreme";
            };

            popup.appendChild(btn);
            document.body.appendChild(popup);
        }
    });
});
