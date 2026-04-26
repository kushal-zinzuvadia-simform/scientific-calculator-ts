// Reading and writing the calculator display element.

export class DisplayManager {
    private element: HTMLElement;

    constructor(displayElement: HTMLElement) {
        this.element = displayElement;
    }

    getText(): string {
        return this.element.textContent ?? "0";
    }

    setText(text: string): void {
        this.element.textContent = text;
    }

    getNumericValue(): number {
        return parseFloat(this.getText()) || 0;
    }

    formatResult(value: number, isExponential: boolean): string {
        if (isNaN(value)) return value.toString();

        if (isExponential) {
            return value.toExponential(6);
        }

        if (Number.isInteger(value)) {
            return value.toString();
        }

        return parseFloat(value.toFixed(6)).toString();
    }
}
