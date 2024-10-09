import { Token } from './dusa-tokenizer.js';
import { ParsedPattern } from './terms.js';
import { ParsedDeclaration, ParsedPremise } from './syntax.js';
import { Issue } from '../parsing/parser.js';
import { SourceLocation, SourcePosition } from '../parsing/source-location.js';
interface Istream<T> {
    next(): T | null;
    peek(): T | null;
}
export declare class DusaSyntaxError extends SyntaxError {
    name: string;
    message: string;
    loc?: SourceLocation;
    constructor(msg: string, loc?: SourceLocation);
}
export declare function parse(str: string): {
    errors: Issue[];
} | {
    errors: null;
    document: ParsedDeclaration[];
};
export declare function parseTokens(tokens: Token[]): (ParsedDeclaration | Issue)[];
export declare function parseHeadValue(t: Istream<Token>): {
    values: null | ParsedPattern[];
    exhaustive: boolean;
    end: SourcePosition | null;
    deprecatedQuestionMark?: Token | undefined;
};
export declare function forcePremise(t: Istream<Token>): ParsedPremise;
export declare function parseDecl(t: Istream<Token>): ParsedDeclaration | null;
export declare function parseFullTerm(t: Istream<Token>): ParsedPattern | null;
export declare function parseTerm(t: Istream<Token>): ParsedPattern | null;
export {};
