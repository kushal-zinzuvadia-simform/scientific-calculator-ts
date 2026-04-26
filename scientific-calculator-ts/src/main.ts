import './style.css'
import { Calculator } from "./calculator.ts";

const scrollAmount = 30;

const display = document.getElementById("result-display") as HTMLElement;
const historyPanel = document.getElementById("history-items") as HTMLElement;
const historyToggleBtn = document.getElementById("historyToggle") as HTMLElement;
const historySidebar = document.getElementById("history-panel") as HTMLElement;
const clearHistoryBtn = document.getElementById("clearHistory") as HTMLElement;

const calculator = new Calculator(display, historyPanel);

let outer2ndActive = false;
const outer2ndBtn = document.getElementById("outer-2nd-btn") as HTMLElement;
const squareBtn = document.getElementById("square-btn") as HTMLElement;
const sqrtBtn = document.getElementById("sqrt-btn") as HTMLElement;
const powerBtn = document.getElementById("power-btn") as HTMLElement;

let trig2ndActive = false;
const trig2ndBtn = document.getElementById("trig-2nd-btn") as HTMLElement;
const sinBtn = document.getElementById("sin-btn") as HTMLElement;
const cosBtn = document.getElementById("cos-btn") as HTMLElement;
const tanBtn = document.getElementById("tan-btn") as HTMLElement;

// Dropdown JS toggle
const trigDropdownBtn = document.getElementById("trig-dropdown-btn") as HTMLElement;
const trigDropdownContent = document.getElementById("trig-dropdown-content") as HTMLElement;
const funcDropdownBtn = document.getElementById("func-dropdown-btn") as HTMLElement;
const funcDropdownContent = document.getElementById("func-dropdown-content") as HTMLElement;

const modeBtn = document.getElementById("mode-btn") as HTMLElement;
const feBtn = document.getElementById("fe-btn") as HTMLElement;

calculator.updateHistoryPanel();

// Make display focusable
display.contentEditable = "false";
display.tabIndex = 0;

modeBtn.addEventListener("click", () => {
  const isDeg = calculator.mode === "DEG";

  calculator.mode = isDeg ? "RAD" : "DEG";
  modeBtn.textContent = calculator.mode;

  modeBtn.classList.toggle("active-mode", calculator.mode === "RAD");
});

feBtn.addEventListener("click", () => {
  calculator.toggleExponential();
  feBtn.classList.toggle("active-mode", calculator.isExponential);
});

// History toggle
historyToggleBtn.addEventListener("click", () => {
  historySidebar.classList.toggle("open");
});

// Clear history
clearHistoryBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  calculator.clearHistory();
});

outer2ndBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  outer2ndActive = !outer2ndActive;
  if (outer2ndActive) {
    outer2ndBtn.classList.add("active-2nd");
    squareBtn.textContent = "x³";
    sqrtBtn.textContent = "³√x";
    powerBtn.textContent = "2ˣ";
  } else {
    outer2ndBtn.classList.remove("active-2nd");
    squareBtn.textContent = "x²";
    sqrtBtn.textContent = "²√x";
    powerBtn.textContent = "10ˣ";
  }
});

trig2ndBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  trig2ndActive = !trig2ndActive;
  if (trig2ndActive) {
    trig2ndBtn.classList.add("active-2nd");
    sinBtn.textContent = "sin⁻¹";
    cosBtn.textContent = "cos⁻¹";
    tanBtn.textContent = "tan⁻¹";
  } else {
    trig2ndBtn.classList.remove("active-2nd");
    sinBtn.textContent = "sin";
    cosBtn.textContent = "cos";
    tanBtn.textContent = "tan";
  }
});

function closeAllDropdowns() {
  trigDropdownContent.classList.remove("open");
  funcDropdownContent.classList.remove("open");
}

trigDropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const wasOpen = trigDropdownContent.classList.contains("open");
  closeAllDropdowns();
  if (!wasOpen) trigDropdownContent.classList.add("open");
});

funcDropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const wasOpen = funcDropdownContent.classList.contains("open");
  closeAllDropdowns();
  if (!wasOpen) funcDropdownContent.classList.add("open");
});

document.addEventListener("click", (e) => {
  if (!(e.target as HTMLElement).closest(".dropdown")) {
    closeAllDropdowns();
  }
});

document.body.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("button");
  if (!btn) return;

  if (btn.id === "historyToggle" || btn.id === "clearHistory") return;
  if (btn.id === "outer-2nd-btn" || btn.id === "trig-2nd-btn") return;
  if (btn.dataset.type === "mode") return;
  if (btn.classList.contains("dropdown-btn")) return;

  let value = btn.innerText;

  if (value === "=") {
    calculator.calculate();
    display.focus();
  } else if (value === "C") {
    calculator.clear();
  } else if (value === "MS" || value === "MR" || value === "M+" || value === "M-" || value === "MC") {
    calculator.handleMemory(value);
  }
  else if (btn.getAttribute("aria-label") === "Backspace") {
    calculator.delete();

  } else if (btn.id === "square-btn") {
    if (outer2ndActive) {
      calculator.applyCube();
    } else {
      calculator.applySquare();
    }

  } else if (btn.id === "sqrt-btn") {
    if (outer2ndActive) {
      calculator.applyCubeRoot();
    } else {
      calculator.applySquareRoot();
    }

  } else if (btn.id === "power-btn") {
    if (outer2ndActive) {
      calculator.applyTwoPower();
    } else {
      calculator.applyTenPower();
    }

  } else if (value === "xʸ") {
    calculator.applyPower();
  } else if (value === "1/x") {
    calculator.applyReciprocal();
  } else if (value === "|x|") {
    calculator.applyAbsolute();
  } else if (value === "n!") {
    calculator.applyFactorial();
  } else if (value === "log") {
    calculator.applyLog10();
  } else if (value === "ln") {
    calculator.applyLn();
  } else if (value === "exp") {
    calculator.applyExp();
  } else if (value === "+/-") {
    calculator.applyNegate();
  } else if (btn.id === "sin-btn") {
    if (trig2ndActive) {
      calculator.applyAsin();
    } else {
      calculator.applySin();
    }
  } else if (btn.id === "cos-btn") {
    if (trig2ndActive) {
      calculator.applyAcos();
    } else {
      calculator.applyCos();
    }
  } else if (btn.id === "tan-btn") {
    if (trig2ndActive) {
      calculator.applyAtan();
    } else {
      calculator.applyTan();
    }

  } else if (value === "⌊x⌋") {
    calculator.applyFloor();
  } else if (value === "⌈x⌉") {
    calculator.applyCeil();
  } else if (value === "rand") {
    calculator.applyRand();
  } else if (value === "round") {
    calculator.applyRound();

  } else {
    if (value === "mod") {
      value = "%";
    }
    calculator.append(value);
  }
});

// Keyboard input support
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // Handle modulo 
  if (key === "%") {
    calculator.append("%");
    e.preventDefault();
    return;
  }

  if (key >= "0" && key <= "9") {
    calculator.append(key);
    e.preventDefault();
  }

  else if (key === ".") {
    calculator.append(".");
    e.preventDefault();
  }

  else if (key === "+") {
    calculator.append("+");
    e.preventDefault();
  }
  else if (key === "-") {
    calculator.append("-");
    e.preventDefault();
  }
  else if (key === "*") {
    calculator.append("×");
    e.preventDefault();
  }
  else if (key === "/") {
    calculator.append("÷");
    e.preventDefault();
  }
  else if (key === "!") {
    calculator.append("!");
    e.preventDefault();
  }
  else if (key === "^") {
    calculator.append("^");
    e.preventDefault();
  }

  else if (key === "Enter" || key === "=") {
    calculator.calculate();
    display.focus();
    e.preventDefault();
  }

  else if (key === "Escape") {
    calculator.clear();
    e.preventDefault();
  }

  else if (key === "Backspace") {
    calculator.delete();
    e.preventDefault();
  }
  // Arrow Keys for scrolling result
  else if ((key === "ArrowLeft" || key === "ArrowRight") && document.activeElement === display) {
    handleResultScroll(key);
    e.preventDefault();
  }
});

// Handle result scrolling with arrow keys
function handleResultScroll(direction: "ArrowLeft" | "ArrowRight") {

  if (direction === "ArrowLeft") {
    display.scrollLeft -= scrollAmount;
  } else if (direction === "ArrowRight") {
    display.scrollLeft += scrollAmount;
  }
}