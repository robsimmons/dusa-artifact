import { Issue } from '../parsing/parser.js';
import { ParsedDeclaration } from './syntax.js';
export declare function checkPropositionArity(decls: (Issue | ParsedDeclaration)[]): {
    issues: null;
    arities: {
        [pred: string]: number;
    };
} | {
    issues: Issue[];
};
export declare function checkFreeVarsInDecl(decl: ParsedDeclaration): Issue[];
/**
 * This check assumes that the first free variable checks have passed, and serves
 * only to check that the flattening transformation will produce a well-moded program when
 * functional predicates get flattened out into separate premises, and where functional
 * predicates in new premises have a appropriate number of arguments.
 */
export declare function checkFunctionalPredicatesInDecl(preds: Map<string, number>, decl: ParsedDeclaration): Issue[];
export declare function check(decls: ParsedDeclaration[]): {
    errors: Issue[];
    arities: Map<string, number>;
};
