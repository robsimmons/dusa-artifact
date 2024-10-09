import { IndexedProgram } from './indexize.js';
import { ParsedDeclaration } from './syntax.js';
export declare function indexToRuleName(index: number): string;
/** Compiles a *checked* program */
export declare function compile(decls: ParsedDeclaration[], debug?: boolean): IndexedProgram;
