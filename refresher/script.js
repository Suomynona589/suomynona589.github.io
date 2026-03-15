let count = sessionStorage.getItem("refreshCount")
if (!count) count = 0
count++
sessionStorage.setItem("refreshCount", count)
document.getElementById("score").textContent = count

document.getElementById("refreshBtn").onclick = () => {
    setTimeout(() => location.reload(), 1200)
}
