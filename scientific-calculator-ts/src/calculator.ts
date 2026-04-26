import { Expression } from "./expression.ts";
import { History } from "./history.ts";

type CalculatorMode = "DEG" | "RAD";

export class Calculator {
    private display: HTMLElement;
    private historyPanel: HTMLElement;
    private expression: Expression;
    private history: History;
    private justCalculated: boolean;
    private hasError: boolean;
    public memory: number;
    public mode: CalculatorMode;
    public isExponential: boolean;

    constructor(displayElement: HTMLElement, historyPanel: HTMLElement) {
        this.display = displayElement;
        this.historyPanel = historyPanel;
        this.expression = new Expression();
        this.history = new History();
        this.justCalculated = false;
        this.hasError = false;
        this.memory = 0;
        this.mode = "DEG";
        this.isExponential = false;
    }

    /** Safely reads display text, never returns null or empty */
    private getDisplayText(): string {
        return this.display.textContent ?? "0";
    }

    private getCurrentValue(): number {
        const text = this.getDisplayText();
        return parseFloat(text) || 0;
    }

    private updateDisplay(text: string): void {
        this.display.textContent = text;
    }

    private isStartOfNewEntry(value: string): boolean {
        return /^[0-9.]$/.test(value) || value === "π" || value === "e";
    }

    private isOperator(value: string): boolean {
        return ["+", "-", "×", "÷", "%", "!"].includes(value);
    }

    private clearIfError(): boolean {
        if (this.hasError) {
            this.updateDisplay("0");
            this.hasError = false;
            this.justCalculated = false;
            return true;
        }
        return false;
    }

    handleMemory(type: "MS" | "MR" | "M+" | "M-" | "MC"): void {
        if (this.hasError) return;
        const value = this.getCurrentValue();

        switch (type) {
            case "MS": this.memory = value; break;
            case "MR": {
                const memValue = this.formatResult(this.memory);
                const current = this.getDisplayText();
                const lastChar = current[current.length - 1];

                if (this.justCalculated || current === "0") {
                    this.updateDisplay(memValue);
                } else if (lastChar && /[+\-×÷%^(]/.test(lastChar)) {
                    this.updateDisplay(current + memValue);
                } else {
                    this.updateDisplay(memValue);
                }

                this.justCalculated = false;
                break;
            }
            case "M+": this.memory += value; break;
            case "M-": this.memory -= value; break;
            case "MC": this.memory = 0; break;
        }
    }

    append(value: string): void {
        if (this.hasError) {
            this.clearIfError();
            // For operators after error: start with "0"
            if (this.isOperator(value)) {
                this.updateDisplay("0" + value);
                return;
            }
            if (value === ".") {
                this.updateDisplay("0.");
                return;
            }
            // For digits, constants, parens: set directly
            this.updateDisplay(value);
            return;
        }

        const currentText = this.getDisplayText();
        const lastChar = currentText[currentText.length - 1];
        const operatorLike = new Set(["+", "-", "×", "÷", "%", "!", "^"]);

        // Prevent consecutive tokens 
        if (lastChar && operatorLike.has(value) && operatorLike.has(lastChar)) {
            if (value === lastChar) {
                return;
            }
            this.updateDisplay(currentText.slice(0, -1) + value);
            this.justCalculated = false;
            return;
        }

        // Prevent consecutive decimal 
        if (value === ".") {
            const lastNumberMatch = currentText.match(/(\d*\.?\d*)$/);
            if (lastNumberMatch && lastNumberMatch[1].includes(".")) {
                return;
            }
            if (lastChar === ".") {
                return;
            }
        }

        if ((lastChar === "π" || lastChar === "e") && /[0-9(]/.test(value)) {
            this.updateDisplay(currentText + "×" + value);
            this.justCalculated = false;
            return;
        }

        if (this.justCalculated && this.isStartOfNewEntry(value)) {
            this.updateDisplay(value);
        } else if (this.justCalculated && this.isOperator(value)) {
            this.updateDisplay(currentText + value);
        } else if (currentText === "0" && value === ".") {
            this.updateDisplay("0.");
        } else if (currentText === "0" && this.isOperator(value)) {
            this.updateDisplay(`0${value}`);
        } else if (currentText === "0" && value !== ")") {
            this.updateDisplay(value);
        } else {
            this.updateDisplay(currentText + value);
        }

        this.justCalculated = false;
    }

    clear(): void {
        this.updateDisplay("0");
        this.justCalculated = false;
        this.hasError = false;
    }

    delete(): void {
        if (this.hasError) {
            this.clear();
            return;
        }
        const currentText = this.getDisplayText();
        if (currentText.length <= 1) {
            this.updateDisplay("0");
        } else {
            this.updateDisplay(currentText.slice(0, -1));
        }
    }

    formatResult(value: number): string {
        if (isNaN(value)) return value.toString();

        if (this.isExponential) {
            return value.toExponential(6);
        }

        if (Number.isInteger(value)) {
            return value.toString();
        }

        return parseFloat(value.toFixed(6)).toString();
    }

    private evaluateCurrentExpression(): number {
        const input = this.getDisplayText().trim();
        const result = this.expression.evaluate(input, this.mode);
        if (isNaN(result) || !isFinite(result)) {
            throw new Error("Invalid result");
        }
        return result;
    }

    calculate(): void {
        if (this.hasError) return;

        try {
            const input = this.getDisplayText().trim();
            const result = this.evaluateCurrentExpression();

            if (isNaN(result) || !isFinite(result)) {
                this.updateDisplay(result === Infinity || result === -Infinity ? "Infinite" : "Invalid expression");
                this.hasError = true;
                this.justCalculated = false;
                return;
            }

            const formattedResult = this.formatResult(result);

            this.updateDisplay(formattedResult);
            this.justCalculated = true;

            // Add to history
            this.history.add(input, Number(formattedResult));
            this.updateHistoryPanel();
        } catch (err) {
            this.updateDisplay("Invalid expression");
            this.hasError = true;
            this.justCalculated = false;
        }
    }

    updateHistoryPanel(): void {
        if (!this.historyPanel) return;

        const items = this.history.getAll();
        this.historyPanel.replaceChildren();

        if (items.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'history-empty';
            emptyDiv.textContent = 'History is empty';
            this.historyPanel.appendChild(emptyDiv);
            return;
        }

        items.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const expressionDiv = document.createElement('div');
            expressionDiv.className = 'history-expression';
            expressionDiv.textContent = item.expression;

            const resultDiv = document.createElement('div');
            resultDiv.className = 'history-result';
            resultDiv.textContent = item.result.toString();

            historyItem.appendChild(expressionDiv);
            historyItem.appendChild(resultDiv);

            historyItem.addEventListener('click', () => {
                this.updateDisplay(item.expression);
                this.hasError = false;
            });

            this.historyPanel.appendChild(historyItem);
        });
    }

    clearHistory(): void {
        this.history.clear();
        this.updateHistoryPanel();
    }

    // Common function for unary operations
    private applyUnaryFunction(format: string): void {
        if (this.hasError) return;

        const expr = this.getDisplayText();
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
                this.updateDisplay(openForm);
                this.justCalculated = false;
                return;
            }
        }

        this.updateDisplay(format.replace("%s", expr));
        this.justCalculated = false;
    }

    private appendToExpression(suffix: string): void {
        if (this.hasError) return;
        const expr = this.getDisplayText();
        const lastChar = expr[expr.length - 1];

        // "^" is only valid after a digit, ")", π, e
        if (suffix === "^") {
            if (expr === "0") return;
            if (!/[0-9)πe]$/.test(expr)) return;
            if (lastChar === "^" || lastChar === "!") return;
        }

        this.updateDisplay(expr + suffix);
        this.justCalculated = false;
    }

    toggleExponential(): void {
        this.isExponential = !this.isExponential;

        if (this.justCalculated) {
            const value = this.getCurrentValue();
            this.updateDisplay(this.formatResult(value));
        }
    }

    applySquare(): void {
        this.applyUnaryFunction("(%s)^2");
    }

    applyPower(): void {
        this.appendToExpression("^");
    }

    applyTenPower(): void {
        this.applyUnaryFunction("10^(%s)");
    }

    applyReciprocal(): void {
        if (this.hasError) return;
        const expr = this.getDisplayText();
        if (expr === "0") {
            this.updateDisplay("1/(");
        } else {
            this.updateDisplay("1/(" + expr + ")");
        }
        this.justCalculated = false;
    }

    applyAbsolute(): void {
        this.applyUnaryFunction("abs(%s)");
    }

    applySquareRoot(): void {
        this.applyUnaryFunction("√(%s)");
    }

    applyFactorial(): void {
        this.applyUnaryFunction("%s!");
    }

    applyLog10(): void {
        this.applyUnaryFunction("log(%s)");
    }

    applyLn(): void {
        this.applyUnaryFunction("ln(%s)");
    }

    applyExp(): void {
        this.applyUnaryFunction("%s^");
    }

    applyCube(): void {
        this.applyUnaryFunction("(%s)^3");
    }

    applyCubeRoot(): void {
        this.applyUnaryFunction("∛(%s)");
    }

    applyTwoPower(): void {
        this.applyUnaryFunction("2^(%s)");
    }

    applySin(): void {
        this.applyUnaryFunction("sin(%s)");
    }

    applyCos(): void {
        this.applyUnaryFunction("cos(%s)");
    }

    applyTan(): void {
        this.applyUnaryFunction("tan(%s)");
    }

    applyAsin(): void {
        this.applyUnaryFunction("asin(%s)");
    }

    applyAcos(): void {
        this.applyUnaryFunction("acos(%s)");
    }

    applyAtan(): void {
        this.applyUnaryFunction("atan(%s)");
    }

    // +/- 
    applyNegate(): void {
        if (this.hasError) {
            this.clearIfError();
            return;
        }
        const expr = this.getDisplayText();
        if (expr === "0") return;

        // position where the last operand begins
        let i = expr.length - 1;

        // Skip trailing digits/dots
        if (/[0-9.πe]/.test(expr[i])) {
            while (i >= 0 && /[0-9.πe]/.test(expr[i])) {
                i--;
            }

            const prefix = expr.substring(0, i + 1);
            const operand = expr.substring(i + 1);

            if (prefix === "" || prefix === "-") {
                // single number
                if (expr.startsWith("-")) {
                    this.updateDisplay(expr.substring(1));
                } else {
                    this.updateDisplay("-" + expr);
                }
            } else if (prefix.endsWith("(-")) {
                // operand is already negated 
                this.updateDisplay(prefix.slice(0, -1) + operand);
            } else if (prefix.endsWith("(")) {
                this.updateDisplay(prefix + "-" + operand);
            } else if (prefix.endsWith("-")) {
                // binary minus 
                const beforeMinus = prefix.length >= 2 ? prefix[prefix.length - 2] : undefined;
                if (beforeMinus && /[0-9)πe]/.test(beforeMinus)) {
                    this.updateDisplay(prefix + "(-" + operand + ")");
                } else {
                    // unary minus
                    this.updateDisplay(prefix.slice(0, -1) + operand);
                }
            } else {
                this.updateDisplay(prefix + "(-" + operand + ")");
            }
        } else if (expr[i] === ')') {
            if (expr.startsWith("-(") && expr.endsWith(")")) {
                this.updateDisplay(expr.substring(2, expr.length - 1));
            } else {
                this.updateDisplay("-(" + expr + ")");
            }
        }
    }

    applyFloor(): void {
        this.applyUnaryFunction("floor(%s)");
    }

    applyCeil(): void {
        this.applyUnaryFunction("ceil(%s)");
    }

    applyRand(): void {
        const result = Math.random();
        const formattedResult = this.formatResult(result);
        this.updateDisplay(formattedResult);
        this.justCalculated = true;
        this.hasError = false;
        this.history.add("rand()", Number(formattedResult));
        this.updateHistoryPanel();
    }

    applyRound(): void {
        this.applyUnaryFunction("round(%s)");
    }
}