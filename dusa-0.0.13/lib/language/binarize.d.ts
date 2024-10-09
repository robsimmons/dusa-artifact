import { FlatDeclaration, FlatPremise } from './flatten.js';
import { Pattern } from './terms.js';
/**
 * Binarization transformation
 *
 * The binarization transformation is straightforward in implementation and
 * concept. A rule of this form:
 *
 *     a: C :- P0, P2, ... Pn.
 *
 * is turned into a series of rule n+1 rules, each with either one or two premises:
 *
 *     $a1 <vars> :- $a0, P0.
 *     ...
 *     $a(i+1) <vars> :- $ai <vars>, Pi.
 *     ...
 *     C :- $a(n+1).
 */
export declare function freeVarsBinarizedPremise(premise: FlatPremise): Set<string>;
export type BinarizedRule = {
    type: 'Binary';
    premise: FlatPremise;
    inName: string;
    inVars: string[];
    outName: string;
    outVars: string[];
    premiseNumber: number;
    totalPremises: number;
} | {
    type: 'Conclusion';
    inName: string;
    inVars: string[];
    name: string;
    args: Pattern[];
    values: Pattern[];
    exhaustive: boolean;
};
export interface BinarizedProgram {
    seeds: string[];
    rules: BinarizedRule[];
    forbids: string[];
    demands: string[];
}
export declare function binarizedProgramToString(program: BinarizedProgram): string;
export declare function binarize(decls: [string, FlatDeclaration][]): BinarizedProgram;
