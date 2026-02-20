document.addEventListener("DOMContentLoaded", () => {
    let answered = 0;
    let correct = 0;

    document.addEventListener("click", event => {
        const btn = event.target;

        if (!btn.classList.contains("see") && !btn.classList.contains("nosee")) return;

        const box = btn.closest(".test-box");
        if (!box || box.dataset.done) return;

        box.dataset.done = "1";
        answered++;

        if (btn.classList.contains("nosee")) correct++;

        if (answered === 5) {
            const percent = correct * 20;
            document.getElementById("result").textContent = percent + "%";
        }
    });
});
