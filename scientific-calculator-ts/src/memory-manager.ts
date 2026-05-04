// Manage calculator memory operations (MS, MR, M+, M-, MC).

export class MemoryManager {
    private value: number;

    constructor() {
        this.value = 0;
    }

    store(num: number): void {
        this.value = num;
    }

    recall(): number {
        return this.value;
    }

    add(num: number): void {
        this.value += num;
    }

    subtract(num: number): void {
        this.value -= num;
    }

    clear(): void {
        this.value = 0;
    }
}
