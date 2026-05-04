export interface HistoryItem {
    expression: string;
    result: number;
}

export class History {
    private maxSize: number;
    private items: HistoryItem[];

    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.items = this.loadFromStorage();
    }

    add(expression: string, result: number) {
        const item = {
            expression: expression,
            result: result
        };

        this.items.unshift(item);

        if (this.items.length > this.maxSize) {
            this.items.pop();
        }

        this.saveToStorage();
    }

    getAll(): HistoryItem[] {
        return this.items;
    }

    clear() {
        this.items = [];
        this.saveToStorage();
    }

    saveToStorage() {
        try {
            localStorage.setItem('calculatorHistory', JSON.stringify(this.items));
        } catch (error) {
            console.warn('Unable to save calculator history to localStorage.', error);
        }
    }

    loadFromStorage(): HistoryItem[] {
        try {
            const saved = localStorage.getItem('calculatorHistory');
            return saved ? JSON.parse(saved) as HistoryItem[] : [];
        } catch (error) {
            console.warn('Unable to load calculator history from localStorage.', error);
            return [];
        }
    }
}