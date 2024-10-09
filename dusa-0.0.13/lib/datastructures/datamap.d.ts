import { Data } from './data.js';
export declare class DataMap<T> {
    private indexTree;
    private bigintTree;
    private constructor();
    static new<T>(): DataMap<T>;
    set(key: Data, value: T): DataMap<T>;
    get(key: Data): T | null;
    getNth(n: number): [Data, T];
    remove(key: Data): [T, DataMap<T>] | null;
    entries(): [Data, T][];
    get length(): number;
    every(test: (key: Data, value: T) => boolean): boolean;
    popFirst(): [Data, T, DataMap<T>];
    popRandom(): [Data, T, DataMap<T>];
    isOk(): boolean;
}
export declare class TrieMap<K, V> {
    private t;
    private constructor();
    static new<K, V>(): TrieMap<K, V>;
    arity(name: string): number | null;
    set(name: string, args: K[], value: V): {
        result: TrieMap<K, V>;
        removed: V | null;
    };
    get(name: string, args: K[]): V | null;
    lookup(name: string, args: K[]): IterableIterator<{
        keys: K[];
        value: V;
    }>;
    entries(): IterableIterator<{
        name: string;
        keys: K[];
        value: V;
    }>;
}
