import './style.css'
import { Calculator } from "./calculator.ts";
import { ButtonHandler } from "./button-handler.ts";

const scrollAmount = 30;

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Required DOM element with id "${id}" not found`);
    }
    return element as T;
}

const display = getElement("result-display");
const historyPanel = getElement("history-items");
const historyToggleBtn = getElement("historyToggle");
const historySidebar = getElement("history-panel");
const clearHistoryBtn = getElement("clearHistory");

const calculator = new Calculator(display, historyPanel);
const buttonHandler = new ButtonHandler(calculator);

let outer2ndActive = false;
const outer2ndBtn = getElement("outer-2nd-btn");
const squareBtn = getElement("square-btn");
const sqrtBtn = getElement("sqrt-btn");
const powerBtn = getElement("power-btn");

let trig2ndActive = false;
const trig2ndBtn = getElement("trig-2nd-btn");
const sinBtn = getElement("sin-btn");
const cosBtn = getElement("cos-btn");
const tanBtn = getElement("tan-btn");

// Dropdown JS toggle
const trigDropdownBtn = getElement("trig-dropdown-btn");
const trigDropdownContent = getElement("trig-dropdown-content");
const funcDropdownBtn = getElement("func-dropdown-btn");
const funcDropdownContent = getElement("func-dropdown-content");

const modeBtn = getElement("mode-btn");
const feBtn = getElement("fe-btn");

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
  buttonHandler.setOuter2ndActive(outer2ndActive);
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
  buttonHandler.setTrig2ndActive(trig2ndActive);
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

  buttonHandler.handleButtonClick(btn);
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