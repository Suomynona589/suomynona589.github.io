document.addEventListener("DOMContentLoaded", () => {
    let answered = 0;
    let correct = 0;

    const resultBox = document.getElementById("result");

    document.addEventListener("click", event => {
        const target = event.target;

        const isSee = target.classList.contains("see");
        const isNoSee = target.classList.contains("nosee");

        if (!isSee && !isNoSee) return;

        const box = target.closest(".test-box");
        if (!box || box.dataset.done) return;

        box.dataset.done = "1";
        answered++;

        if (isNoSee) correct++;

        if (answered === 5) {
            const percent = correct * 20;
            resultBox.textContent = percent + "%";
        }
    });
});
