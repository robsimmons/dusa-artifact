import { Data } from './datastructures/data.js';
export type Term = null | bigint | string | boolean | {
    name: null;
    value: number;
} | {
    name: string;
    args?: [Term, ...Term[]];
};
export interface Fact {
    name: string;
    args: Term[];
    value: Term;
}
export type InputTerm = null | number | boolean | bigint | string | {
    name: null;
    value: number;
} | {
    name: string;
    args?: InputTerm[];
};
export interface InputFact {
    name: string;
    args: InputTerm[];
    value?: InputTerm;
}
export type JsonData = null | number | bigint | string | JsonData[] | {
    [field: string]: JsonData;
};
export declare function dataToTerm(d: Data): Term;
export declare function termToData(tm: InputTerm): Data;
