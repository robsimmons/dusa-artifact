import { Data } from './data.js';
import { DataMap } from './datamap.js';
export declare class AttributeMap<T> {
    map: DataMap<T>;
    private constructor();
    static new<T>(): AttributeMap<T>;
    set(name: string, args: Data[], value: T): AttributeMap<T>;
    get(name: string, args: Data[]): T | null;
    remove(name: string, args: Data[]): [T, AttributeMap<T>] | null;
    entries(): [string, Data[], T][];
    get length(): number;
    every(test: (name: string, args: Data[], value: T) => boolean): boolean;
    popFirst(): [string, Data[], T, AttributeMap<T>];
    popRandom(): [string, Data[], T, AttributeMap<T>];
}
