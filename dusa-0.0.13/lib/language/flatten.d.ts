import { SourceLocation } from '../parsing/source-location.js';
import { BUILT_IN_PRED } from './dusa-builtins.js';
import { Conclusion, ParsedDeclaration } from './syntax.js';
import { Pattern } from './terms.js';
export interface FlatProposition {
    type: 'Proposition';
    name: string;
    args: Pattern[];
    value: Pattern;
    loc: SourceLocation;
}
export interface BuiltinProposition {
    type: 'Builtin';
    name: BUILT_IN_PRED;
    symbol: null | string;
    matchPosition: null | number;
    args: Pattern[];
    value: Pattern;
    loc: SourceLocation;
}
export type FlatPremise = FlatProposition | BuiltinProposition;
export type FlatDeclaration = {
    type: 'Forbid';
    premises: FlatPremise[];
    loc?: SourceLocation;
} | {
    type: 'Demand';
    premises: FlatPremise[];
    loc?: SourceLocation;
} | {
    type: 'Rule';
    premises: FlatPremise[];
    conclusion: Conclusion;
    loc?: SourceLocation;
};
export declare function indexToRuleName(index: number): string;
export declare function flattenAndName(decls: ParsedDeclaration[]): [string, FlatDeclaration][];
export declare function flatPremiseToString(premise: FlatPremise): string;
export declare function flatDeclToString([name, decl]: [string, FlatDeclaration]): string;
export declare function flatProgramToString(flatProgram: [string, FlatDeclaration][]): string;
