import { Issue } from '../parsing/parser.js';
import { SourceLocation } from '../parsing/source-location.js';
import { ParsedPattern, Pattern } from './terms.js';
export interface ParsedProposition {
    type: 'Proposition';
    name: string;
    args: ParsedPattern[];
    loc: SourceLocation;
    value: null | ParsedPattern;
}
export interface ParsedTermComparison {
    type: 'Equality' | 'Inequality' | 'Gt' | 'Geq' | 'Lt' | 'Leq';
    a: ParsedPattern;
    b: ParsedPattern;
    loc: SourceLocation;
}
export type ParsedPremise = ParsedProposition | ParsedTermComparison;
export interface Conclusion {
    name: string;
    args: Pattern[];
    values: null | Pattern[];
    exhaustive: boolean;
    loc?: SourceLocation;
}
export interface ParsedConclusion {
    name: string;
    args: ParsedPattern[];
    values: null | ParsedPattern[];
    exhaustive: boolean;
    loc: SourceLocation;
}
export type ParsedDeclaration = {
    type: 'Forbid';
    premises: ParsedPremise[];
    loc: SourceLocation;
} | {
    type: 'Demand';
    premises: ParsedPremise[];
    loc: SourceLocation;
} | {
    type: 'Rule';
    premises: ParsedPremise[];
    conclusion: ParsedConclusion;
    loc: SourceLocation;
    deprecatedQuestionMark: SourceLocation | undefined;
};
export declare function propToString(p: ParsedProposition): string;
export declare function headToString(head: ParsedConclusion | Conclusion): string;
export declare function freeVarsPremise(premise: ParsedPremise): Set<string>;
export declare function declToString(decl: ParsedDeclaration): string;
export declare function visitPropsInProgram(decls: (Issue | ParsedDeclaration)[]): Generator<ParsedProposition | ParsedConclusion, void, unknown>;
export declare function visitSubterms(...terms: ParsedPattern[]): IterableIterator<ParsedPattern>;
export declare function visitTermsInPremises(...premises: ParsedPremise[]): Generator<ParsedPattern, void, undefined>;
export declare function visitTermsinProgram(decls: (Issue | ParsedDeclaration)[]): Generator<ParsedPattern, void, undefined>;
