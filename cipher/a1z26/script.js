function encodeA1Z26(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map(word =>
      word
        .split("")
        .map(ch => {
          if (ch >= "a" && ch <= "z") {
            return ch.charCodeAt(0) - 96;
          }
          return null;
        })
        .filter(n => n !== null)
        .join("-")
    )
    .join(" ");
}

function decodeA1Z26(text) {
  return text
    .split(" ")
    .map(word =>
      word
        .split("-")
        .map(num => {
          let n = parseInt(num);
          if (!isNaN(n) && n >= 1 && n <= 26) {
            return String.fromCharCode(n + 96);
          }
          return "";
        })
        .join("")
    )
    .join(" ");
}

let leftBox = document.getElementById("leftBox");
let rightBox = document.getElementById("rightBox");
let leftHeader = document.getElementById("leftHeader");
let rightHeader = document.getElementById("rightHeader");
let swapBtn = document.getElementById("swapBtn");

let normalOnLeft = true;
let decodeTimer = null;

function update() {
  if (normalOnLeft) {
    rightBox.value = encodeA1Z26(leftBox.value);
  } else {
    rightBox.value = decodeA1Z26(leftBox.value);
  }
}

leftBox.addEventListener("input", () => {
  if (normalOnLeft) {
    update();
    return;
  }

  if (decodeTimer) clearTimeout(decodeTimer);

  if (leftBox.value.endsWith("-")) {
    update();
    return;
  }

  decodeTimer = setTimeout(update, 1500);
});

swapBtn.addEventListener("click", () => {
  normalOnLeft = !normalOnLeft;

  if (normalOnLeft) {
    leftHeader.textContent = "Normal Text";
    rightHeader.textContent = "Ciphered";
  } else {
    leftHeader.textContent = "Ciphered";
    rightHeader.textContent = "Normal Text";
  }

  leftBox.removeAttribute("readonly");
  rightBox.setAttribute("readonly", true);

  update();
});

update();
