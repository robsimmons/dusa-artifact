import { SourceLocation } from '../client.js';
import { BinarizedProgram } from './binarize.js';
import { BUILT_IN_PRED } from './dusa-builtins.js';
import { Pattern } from './terms.js';
/**
 * Indexing transformation
 *
 * The indexing transformation is relatively straightforward to conceptualize, but
 * quite tedious to implement. The goal is to take a every rule in the binarized
 * program of the form
 *
 *     $x <vars> :- $y <vars>, P.
 *
 * (where each introduced predicate --- $x or $y --- is on the left of only one binarized
 * rule) and turn it into a program of the form
 *
 *     $zindex [ <shared> ] [ <introduced> ] :- P.
 *     $xprefix [ <vars1> ] [ <vars2> ] :-
 *         $yprefix [ <shared> ] [ <passed> ],
 *         $zindex [ <shared> ] [ <introduced> ].
 *
 * The critical invariants here are:
 *  - there is no repetition among <shared>, <passed>, and <introduced> variables,
 *    and the three sequences are mutually disjoint
 *  - the $zindex rule and $yprefix predicates in the rule utilize the same set of <shared>
 *    variables in the same order
 *
 * Making the shared variables explicit and consistent in this way makes finding all the
 * $yprefix facts that match a given $zindex fact trivial, and vice versa, but getting there
 * requires a lot of bookkeeping, which is why this ends up being tedious.
 */
export interface IndexedBinaryRuleBase {
    type: string;
    inName: string;
    shared: string[];
    passed: string[];
    introduced: string[];
    outShared: ['shared' | 'passed' | 'introduced', number][];
    outPassed: ['shared' | 'passed' | 'introduced', number][];
    outName: string;
}
export interface IndexedLookup extends IndexedBinaryRuleBase {
    type: 'IndexLookup';
    indexName: string;
}
export interface FunctionLookup extends IndexedBinaryRuleBase {
    type: 'Builtin';
    name: BUILT_IN_PRED;
    symbol: null | string;
    matchPosition: null | number;
    args: Pattern[];
    value: Pattern;
    loc: SourceLocation;
}
export type IndexedBinaryRule = IndexedLookup | FunctionLookup;
export interface IndexInsertionRule {
    name: string;
    args: Pattern[];
    value: Pattern;
    indexName: string;
    shared: string[];
    introduced: string[];
}
export interface IndexedConclusion {
    inName: string;
    inVars: string[];
    name: string;
    args: Pattern[];
    values: Pattern[];
    exhaustive: boolean;
}
export interface IndexedProgram {
    seeds: string[];
    forbids: Set<string>;
    demands: Set<string>;
    indexes: [string, number, number][];
    binaryRules: IndexedBinaryRule[];
    indexInsertionRules: IndexInsertionRule[];
    conclusionRules: IndexedConclusion[];
    prefixToRule: {
        [prefix: string]: IndexedBinaryRule;
    };
    indexToRule: {
        [index: string]: IndexedBinaryRule;
    };
    prefixToConclusion: {
        [prefix: string]: IndexedConclusion;
    };
    factToRules: {
        [name: string]: IndexInsertionRule[];
    };
}
export declare function indexedProgramToString(program: IndexedProgram): string;
export declare function indexize(program: BinarizedProgram): IndexedProgram;
