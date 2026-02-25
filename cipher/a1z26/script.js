function encodeA1Z26(text) {
  let result = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === "[") {
      let end = text.indexOf("]", i);
      if (end !== -1) {
        result.push(text.slice(i, end + 1));
        i = end + 1;
        continue;
      }
    }

    if (/[a-zA-Z]/.test(text[i])) {
      let word = "";
      while (i < text.length && /[a-zA-Z]/.test(text[i])) {
        word += text[i].toLowerCase();
        i++;
      }
      let encoded = word
        .split("")
        .map(ch => ch.charCodeAt(0) - 96)
        .join("-");
      result.push(encoded);
    } else if (text[i] === " ") {
      result.push(" ");
      i++;
    } else {
      i++;
    }
  }

  return result.join("");
}

function decodeA1Z26(text) {
  let result = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === "[") {
      let end = text.indexOf("]", i);
      if (end !== -1) {
        result.push(text.slice(i + 1, end));
        i = end + 1;
        continue;
      }
    }

    if (/[0-9]/.test(text[i])) {
      let numStr = "";
      while (i < text.length && /[0-9]/.test(text[i])) {
        numStr += text[i];
        i++;
      }
      let decoded = String.fromCharCode(parseInt(numStr) + 96);
      result.push(decoded);
    } else if (text[i] === "-") {
      i++;
    } else if (text[i] === " ") {
      result.push(" ");
      i++;
    } else {
      i++;
    }
  }

  return result.join("");
}

let leftBox = document.getElementById("leftBox");
let rightBox = document.getElementById("rightBox");
let leftHeader = document.getElementById("leftHeader");
let rightHeader = document.getElementById("rightHeader");
let swapBtn = document.getElementById("swapBtn");
let calcBtn = document.getElementById("calcBtn");

let normalOnLeft = true;

function calculate() {
  if (normalOnLeft) {
    rightBox.value = encodeA1Z26(leftBox.value);
  } else {
    rightBox.value = decodeA1Z26(leftBox.value);
  }
}

swapBtn.addEventListener("click", () => {
  normalOnLeft = !normalOnLeft;

  let temp = leftBox.value;
  leftBox.value = rightBox.value;
  rightBox.value = temp;

  if (normalOnLeft) {
    leftHeader.textContent = "Normal Text";
    rightHeader.textContent = "Ciphered";
  } else {
    leftHeader.textContent = "Ciphered";
    rightHeader.textContent = "Normal Text";
  }

  leftBox.removeAttribute("readonly");
  rightBox.setAttribute("readonly", true);
});

calcBtn.addEventListener("click", calculate);
