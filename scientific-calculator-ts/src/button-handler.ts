import { Calculator } from "./calculator.ts";

export class ButtonHandler {
    private calculator: Calculator;
    private outer2ndActive: boolean = false;
    private trig2ndActive: boolean = false;

    constructor(calculator: Calculator) {
        this.calculator = calculator;
    }

    setOuter2ndActive(active: boolean): void {
        this.outer2ndActive = active;
    }

    setTrig2ndActive(active: boolean): void {
        this.trig2ndActive = active;
    }

    handleButtonClick(btn: HTMLButtonElement): void {
        // Skip special buttons that are handled elsewhere
        if (this.shouldSkipButton(btn)) {
            return;
        }

        const value = btn.innerText;
        const handler = this.getButtonHandler(btn, value);

        if (handler) {
            handler();
        } else {
            // Default: append the button value
            let appendValue = value;
            if (appendValue === "mod") {
                appendValue = "%";
            }
            this.calculator.append(appendValue);
        }
    }

    private shouldSkipButton(btn: HTMLButtonElement): boolean {
        return (
            btn.id === "historyToggle" ||
            btn.id === "clearHistory" ||
            btn.id === "outer-2nd-btn" ||
            btn.id === "trig-2nd-btn" ||
            btn.dataset["type"] === "mode" ||
            btn.classList.contains("dropdown-btn")
        );
    }

    private getButtonHandler(btn: HTMLButtonElement, value: string): (() => void) | null {
        const handlers: Record<string, () => void> = {
            "=": () => {
                this.calculator.calculate();
                document.getElementById("result-display")?.focus();
            },
            "C": () => this.calculator.clear(),
            "MS": () => this.calculator.handleMemory("MS"),
            "MR": () => this.calculator.handleMemory("MR"),
            "M+": () => this.calculator.handleMemory("M+"),
            "M-": () => this.calculator.handleMemory("M-"),
            "MC": () => this.calculator.handleMemory("MC"),
            "xʸ": () => this.calculator.applyPower(),
            "1/x": () => this.calculator.applyReciprocal(),
            "|x|": () => this.calculator.applyAbsolute(),
            "n!": () => this.calculator.applyFactorial(),
            "log": () => this.calculator.applyLog10(),
            "ln": () => this.calculator.applyLn(),
            "exp": () => this.calculator.applyExp(),
            "+/-": () => this.calculator.applyNegate(),
            "⌊x⌋": () => this.calculator.applyFloor(),
            "⌈x⌉": () => this.calculator.applyCeil(),
            "rand": () => this.calculator.applyRand(),
            "round": () => this.calculator.applyRound(),
        };

        // Handle buttons with aria-label
        if (btn.getAttribute("aria-label") === "Backspace") {
            return () => this.calculator.delete();
        }

        // Handle buttons with specific IDs
        const idHandlers: Record<string, () => void> = {
            "square-btn": () => {
                if (this.outer2ndActive) {
                    this.calculator.applyCube();
                } else {
                    this.calculator.applySquare();
                }
            },
            "sqrt-btn": () => {
                if (this.outer2ndActive) {
                    this.calculator.applyCubeRoot();
                } else {
                    this.calculator.applySquareRoot();
                }
            },
            "power-btn": () => {
                if (this.outer2ndActive) {
                    this.calculator.applyTwoPower();
                } else {
                    this.calculator.applyTenPower();
                }
            },
            "sin-btn": () => {
                if (this.trig2ndActive) {
                    this.calculator.applyAsin();
                } else {
                    this.calculator.applySin();
                }
            },
            "cos-btn": () => {
                if (this.trig2ndActive) {
                    this.calculator.applyAcos();
                } else {
                    this.calculator.applyCos();
                }
            },
            "tan-btn": () => {
                if (this.trig2ndActive) {
                    this.calculator.applyAtan();
                } else {
                    this.calculator.applyTan();
                }
            },
        };

        return handlers[value] || idHandlers[btn.id] || null;
    }
}