let count = sessionStorage.getItem("refreshCount")
if (!count) count = 0
count++
sessionStorage.setItem("refreshCount", count)
document.getElementById("score").textContent = count
document.getElementById("refreshBtn").onclick = () => window.location.href = window.location.href;
