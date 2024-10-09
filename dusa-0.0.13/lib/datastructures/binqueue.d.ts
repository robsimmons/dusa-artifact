export default class PQ<T> {
    private size;
    private heaps;
    private constructor();
    static new<T>(): PQ<T>;
    get length(): number;
    push(prio: number, elem: T): PQ<T>;
    pop(): [T, PQ<T>];
    debugToString(): string;
    toList(): T[];
}
