export type Data = ViewsIndex | bigint;
export type DataView = {
    type: 'triv';
} | {
    type: 'int';
    value: bigint;
} | {
    type: 'bool';
    value: boolean;
} | {
    type: 'string';
    value: string;
} | {
    type: 'const';
    name: string;
    args: Data[];
} | {
    type: 'ref';
    value: number;
};
type ViewsIndex = number;
export declare function DANGER_RESET_DATA(): void;
export declare const TRIV_DATA = 0;
export declare const BOOL_TRUE = 1;
export declare const BOOL_FALSE = 2;
export declare function expose(d: Data): DataView;
export declare function hide(d: DataView): Data;
export declare function compareData(a: Data, b: Data): number;
export declare function escapeString(input: string): string;
export declare function dataToString(d: Data, needsParens?: boolean): string;
export declare function getRef(): Data;
export {};
