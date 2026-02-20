let answered = 0;
let correct = 0;

document.querySelectorAll(".test-box").forEach(box => {
    const see = box.querySelector(".see");
    const nosee = box.querySelector(".nosee");

    see.onclick = () => handleAnswer(box, false);
    nosee.onclick = () => handleAnswer(box, true);
});

function handleAnswer(box, isCorrect) {
    if (box.dataset.done) return;

    box.dataset.done = "1";
    answered++;

    if (isCorrect) correct++;

    if (answered === 5) {
        const percent = correct * 20;
        document.getElementById("result").textContent = percent + "%";
    }
}
