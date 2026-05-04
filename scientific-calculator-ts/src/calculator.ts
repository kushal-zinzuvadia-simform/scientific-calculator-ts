import { Expression } from "./expression.ts";
import { History } from "./history.ts";
import { DisplayManager } from "./display-manager.ts";
import { MemoryManager } from "./memory-manager.ts";
import { HistoryRenderer } from "./history-renderer.ts";

type CalculatorMode = "DEG" | "RAD";

export class Calculator {
    private display: DisplayManager;
    private expression: Expression;
    private history: History;
    private historyRenderer: HistoryRenderer;
    private memoryManager: MemoryManager;
    private justCalculated: boolean;
    private hasError: boolean;
    public mode: CalculatorMode;
    public isExponential: boolean;

    constructor(displayElement: HTMLElement, historyPanel: HTMLElement) {
        this.display = new DisplayManager(displayElement);
        this.expression = new Expression();
        this.history = new History();
        this.historyRenderer = new HistoryRenderer(historyPanel);
        this.memoryManager = new MemoryManager();
        this.justCalculated = false;
        this.hasError = false;
        this.mode = "DEG";
        this.isExponential = false;
    }

    // Helpers

    private isStartOfNewEntry(value: string): boolean {
        return /^[0-9.]$/.test(value) || value === "π" || value === "e";
    }

    private isOperator(value: string): boolean {
        return ["+", "-", "×", "÷", "%", "!"].includes(value);
    }

    private clearIfError(): boolean {
        if (this.hasError) {
            this.display.setText("0");
            this.hasError = false;
            this.justCalculated = false;
            return true;
        }
        return false;
    }

    private formatResult(value: number): string {
        return this.display.formatResult(value, this.isExponential);
    }

    // Memory 

    handleMemory(type: "MS" | "MR" | "M+" | "M-" | "MC"): void {
        if (this.hasError) return;
        const value = this.display.getNumericValue();

        switch (type) {
            case "MS": this.memoryManager.store(value); break;
            case "MR": {
                const memValue = this.formatResult(this.memoryManager.recall());
                const current = this.display.getText();
                const lastChar = current[current.length - 1];

                if (this.justCalculated || current === "0") {
                    this.display.setText(memValue);
                } else if (lastChar && /[+\-×÷%^(]/.test(lastChar)) {
                    this.display.setText(current + memValue);
                } else {
                    this.display.setText(memValue);
                }

                this.justCalculated = false;
                break;
            }
            case "M+": this.memoryManager.add(value); break;
            case "M-": this.memoryManager.subtract(value); break;
            case "MC": this.memoryManager.clear(); break;
        }
    }

    // Input handling 

    append(value: string): void {
        if (this.hasError) {
            this.clearIfError();
            // For operators after error: start with "0"
            if (this.isOperator(value)) {
                this.display.setText("0" + value);
                return;
            }
            if (value === ".") {
                this.display.setText("0.");
                return;
            }
            // For digits, constants, parens: set directly
            this.display.setText(value);
            return;
        }

        const currentText = this.display.getText();
        const lastChar = currentText[currentText.length - 1];
        const operatorLike = new Set(["+", "-", "×", "÷", "%", "!", "^"]);

        // Prevent consecutive tokens 
        if (lastChar && operatorLike.has(value) && operatorLike.has(lastChar)) {
            if (value === lastChar) {
                return;
            }
            this.display.setText(currentText.slice(0, -1) + value);
            this.justCalculated = false;
            return;
        }

        // Prevent consecutive decimal 
        if (value === ".") {
            const lastNumberMatch = currentText.match(/(\d*\.?\d*)$/);
            if (lastNumberMatch?.[1]?.includes(".")) {
                return;
            }
            if (lastChar === ".") {
                return;
            }
        }

        if ((lastChar === "π" || lastChar === "e") && /[0-9(]/.test(value)) {
            this.display.setText(currentText + "×" + value);
            this.justCalculated = false;
            return;
        }

        if (this.justCalculated && this.isStartOfNewEntry(value)) {
            this.display.setText(value);
        } else if (this.justCalculated && this.isOperator(value)) {
            this.display.setText(currentText + value);
        } else if (currentText === "0" && value === ".") {
            this.display.setText("0.");
        } else if (currentText === "0" && this.isOperator(value)) {
            this.display.setText(`0${value}`);
        } else if (currentText === "0" && value !== ")") {
            this.display.setText(value);
        } else {
            this.display.setText(currentText + value);
        }

        this.justCalculated = false;
    }

    clear(): void {
        this.display.setText("0");
        this.justCalculated = false;
        this.hasError = false;
    }

    delete(): void {
        if (this.hasError) {
            this.clear();
            return;
        }
        const currentText = this.display.getText();
        if (currentText.length <= 1) {
            this.display.setText("0");
        } else {
            this.display.setText(currentText.slice(0, -1));
        }
    }

    // Calculation 

    private evaluateCurrentExpression(): number {
        const input = this.display.getText().trim();
        const result = this.expression.evaluate(input, this.mode);
        if (isNaN(result) || !isFinite(result)) {
            throw new Error("Invalid result");
        }
        return result;
    }

    calculate(): void {
        if (this.hasError) return;

        try {
            const input = this.display.getText().trim();
            const result = this.evaluateCurrentExpression();

            if (isNaN(result) || !isFinite(result)) {
                this.display.setText(result === Infinity || result === -Infinity ? "Infinite" : "Invalid expression");
                this.hasError = true;
                this.justCalculated = false;
                return;
            }

            const formattedResult = this.formatResult(result);

            this.display.setText(formattedResult);
            this.justCalculated = true;

            // Add to history
            this.history.add(input, Number(formattedResult));
            this.updateHistoryPanel();
        } catch (err) {
            this.display.setText("Invalid expression");
            this.hasError = true;
            this.justCalculated = false;
        }
    }

    // History

    updateHistoryPanel(): void {
        this.historyRenderer.render(
            this.history.getAll(),
            (expression: string) => {
                this.display.setText(expression);
                this.hasError = false;
            }
        );
    }

    clearHistory(): void {
        this.history.clear();
        this.updateHistoryPanel();
    }

    // Unary operations 

    private applyUnaryFunction(format: string): void {
        if (this.hasError) return;

        const expr = this.display.getText();
        const lastChar = expr[expr.length - 1];
        const isPostfix = format.startsWith("%s");

        if (isPostfix) {
            // Postfix ops (!, ^, x², x³) require an operand
            if (expr === "0") return;
            if (lastChar === "!" || lastChar === "^") return;
            // Must end in a digit, ")", π, or e
            if (!/[0-9)πe]$/.test(expr)) return;
        } else {
            // Prefix/wrap functions 
            if (expr === "0") {
                const openForm = format.replace("(%s)", "(").replace("%s", "");
                this.display.setText(openForm);
                this.justCalculated = false;
                return;
            }
        }

        this.display.setText(format.replace("%s", expr));
        this.justCalculated = false;
    }

    private appendToExpression(suffix: string): void {
        if (this.hasError) return;
        const expr = this.display.getText();
        const lastChar = expr[expr.length - 1];

        // "^" is only valid after a digit, ")", π, e
        if (suffix === "^") {
            if (expr === "0") return;
            if (!/[0-9)πe]$/.test(expr)) return;
            if (lastChar === "^" || lastChar === "!") return;
        }

        this.display.setText(expr + suffix);
        this.justCalculated = false;
    }

    toggleExponential(): void {
        this.isExponential = !this.isExponential;

        if (this.justCalculated) {
            const value = this.display.getNumericValue();
            this.display.setText(this.formatResult(value));
        }
    }

    // Math operation wrappers 

    applySquare(): void { this.applyUnaryFunction("(%s)^2"); }
    applyPower(): void { this.appendToExpression("^"); }
    applyTenPower(): void { this.applyUnaryFunction("10^(%s)"); }
    applyAbsolute(): void { this.applyUnaryFunction("abs(%s)"); }
    applySquareRoot(): void { this.applyUnaryFunction("√(%s)"); }
    applyFactorial(): void { this.applyUnaryFunction("%s!"); }
    applyLog10(): void { this.applyUnaryFunction("log(%s)"); }
    applyLn(): void { this.applyUnaryFunction("ln(%s)"); }
    applyExp(): void { this.applyUnaryFunction("%s^"); }
    applyCube(): void { this.applyUnaryFunction("(%s)^3"); }
    applyCubeRoot(): void { this.applyUnaryFunction("∛(%s)"); }
    applyTwoPower(): void { this.applyUnaryFunction("2^(%s)"); }
    applySin(): void { this.applyUnaryFunction("sin(%s)"); }
    applyCos(): void { this.applyUnaryFunction("cos(%s)"); }
    applyTan(): void { this.applyUnaryFunction("tan(%s)"); }
    applyAsin(): void { this.applyUnaryFunction("asin(%s)"); }
    applyAcos(): void { this.applyUnaryFunction("acos(%s)"); }
    applyAtan(): void { this.applyUnaryFunction("atan(%s)"); }
    applyFloor(): void { this.applyUnaryFunction("floor(%s)"); }
    applyCeil(): void { this.applyUnaryFunction("ceil(%s)"); }
    applyRound(): void { this.applyUnaryFunction("round(%s)"); }

    applyReciprocal(): void {
        if (this.hasError) return;
        const expr = this.display.getText();
        if (expr === "0") {
            this.display.setText("1/(");
        } else {
            this.display.setText("1/(" + expr + ")");
        }
        this.justCalculated = false;
    }

    applyNegate(): void {
        if (this.hasError) {
            this.clearIfError();
            return;
        }
        const expr = this.display.getText();
        if (expr === "0") return;

        // position where the last operand begins
        let i = expr.length - 1;

        // Skip trailing digits/dots
        if (i >= 0 && /[0-9.πe]/.test(expr[i]!)) {
            while (i >= 0 && /[0-9.πe]/.test(expr[i]!)) {
                i--;
            }

            const prefix = expr.substring(0, i + 1);
            const operand = expr.substring(i + 1);

            if (prefix === "" || prefix === "-") {
                // single number
                if (expr.startsWith("-")) {
                    this.display.setText(expr.substring(1));
                } else {
                    this.display.setText("-" + expr);
                }
            } else if (prefix.endsWith("(-")) {
                // operand is already negated 
                this.display.setText(prefix.slice(0, -1) + operand);
            } else if (prefix.endsWith("(")) {
                this.display.setText(prefix + "-" + operand);
            } else if (prefix.endsWith("-")) {
                // binary minus 
                const beforeMinus = prefix.length >= 2 ? prefix[prefix.length - 2] : undefined;
                if (beforeMinus && /[0-9)πe]/.test(beforeMinus)) {
                    this.display.setText(prefix + "(-" + operand + ")");
                } else {
                    // unary minus
                    this.display.setText(prefix.slice(0, -1) + operand);
                }
            } else {
                this.display.setText(prefix + "(-" + operand + ")");
            }
        } else if (expr[i] === ')') {
            if (expr.startsWith("-(") && expr.endsWith(")")) {
                this.display.setText(expr.substring(2, expr.length - 1));
            } else {
                this.display.setText("-(" + expr + ")");
            }
        }
    }

    applyRand(): void {
        const result = Math.random();
        const formattedResult = this.formatResult(result);
        this.display.setText(formattedResult);
        this.justCalculated = true;
        this.hasError = false;
        this.history.add("rand()", Number(formattedResult));
        this.updateHistoryPanel();
    }
}