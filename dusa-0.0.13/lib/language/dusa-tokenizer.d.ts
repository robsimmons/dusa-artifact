import { BUILT_IN_MAP, BUILT_IN_PRED } from './dusa-builtins.js';
import { StreamParser } from '../parsing/parser.js';
import { SourceLocation, SourcePosition } from '../parsing/source-location.js';
type StateRoot = {
    type: 'Normal' | 'Beginning' | 'Builtin3';
    defaults: typeof BUILT_IN_MAP;
} | {
    type: 'Builtin1';
    hashloc: SourceLocation;
    defaults: typeof BUILT_IN_MAP;
} | {
    type: 'Builtin2';
    hashloc: SourceLocation;
    defaults: typeof BUILT_IN_MAP;
    builtin: BUILT_IN_PRED;
} | {
    type: 'InString';
    defaults: typeof BUILT_IN_MAP;
    start: SourcePosition;
    end: SourcePosition;
    collected: string;
};
declare const punct: readonly ["...", ",", ".", "{", "}", "(", ")", ":-", "->", "!=", "==", "?", ">=", ">", "<=", "<"];
type PUNCT = (typeof punct)[number];
export type Token = {
    loc: SourceLocation;
    type: PUNCT;
} | {
    loc: SourceLocation;
    type: 'is';
} | {
    loc: SourceLocation;
    type: 'is?';
} | {
    loc: SourceLocation;
    type: 'in';
} | {
    loc: SourceLocation;
    type: 'const';
    value: string;
} | {
    loc: SourceLocation;
    type: 'builtin';
    value: string;
    builtin: BUILT_IN_PRED;
} | {
    loc: SourceLocation;
    type: 'var';
    value: string;
} | {
    loc: SourceLocation;
    type: 'wildcard';
    value: string;
} | {
    loc: SourceLocation;
    type: 'triv';
} | {
    loc: SourceLocation;
    type: 'int';
    value: number;
} | {
    loc: SourceLocation;
    type: 'string';
    value: string;
} | {
    loc: SourceLocation;
    type: 'hashdirective';
    value: string;
};
export type ParserState = StateRoot;
export declare const dusaTokenizer: StreamParser<ParserState, Token>;
export {};
