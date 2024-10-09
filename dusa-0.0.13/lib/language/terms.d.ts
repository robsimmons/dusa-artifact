import { SourceLocation } from '../parsing/source-location.js';
import { BUILT_IN_PRED } from './dusa-builtins.js';
export type Pattern = {
    type: 'triv';
} | {
    type: 'int';
    value: number;
} | {
    type: 'bool';
    value: boolean;
} | {
    type: 'string';
    value: string;
} | {
    type: 'const';
    name: string;
    args: Pattern[];
} | {
    type: 'wildcard';
    name: null | string;
} | {
    type: 'var';
    name: string;
};
export type ParsedPattern = {
    type: 'triv';
    loc: SourceLocation;
} | {
    type: 'int';
    value: number;
    loc: SourceLocation;
} | {
    type: 'bool';
    value: boolean;
    loc: SourceLocation;
} | {
    type: 'string';
    value: string;
    loc: SourceLocation;
} | {
    type: 'const';
    name: string;
    args: ParsedPattern[];
    loc: SourceLocation;
} | {
    type: 'special';
    name: BUILT_IN_PRED;
    symbol: string;
    args: ParsedPattern[];
    loc: SourceLocation;
} | {
    type: 'wildcard';
    name: null | string;
    loc: SourceLocation;
} | {
    type: 'var';
    name: string;
    loc: SourceLocation;
};
export declare function termToString(t: Pattern | ParsedPattern, needsParens?: boolean): string;
export declare function theseVarsGroundThisPattern(vars: Set<string>, t: ParsedPattern): boolean;
export declare function repeatedWildcards(knownWildcards: Set<string>, ...patterns: ParsedPattern[]): [string, SourceLocation][];
export declare function freeVars(...patterns: (Pattern | ParsedPattern)[]): Set<string>;
export declare function freeParsedVars(...patterns: ParsedPattern[]): Map<string, SourceLocation>;
