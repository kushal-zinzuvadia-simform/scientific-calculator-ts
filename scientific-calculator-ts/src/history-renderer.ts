import type { HistoryItem } from "./history.ts";

// Render calculator history items into DOM panel.

export class HistoryRenderer {
    private panel: HTMLElement;

    constructor(panelElement: HTMLElement) {
        this.panel = panelElement;
    }

    render(items: HistoryItem[], onItemClick: (expression: string) => void): void {
        if (!this.panel) return;

        this.panel.replaceChildren();

        if (items.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'history-empty';
            emptyDiv.textContent = 'History is empty';
            this.panel.appendChild(emptyDiv);
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
                onItemClick(item.expression);
            });

            this.panel.appendChild(historyItem);
        });
    }
}
