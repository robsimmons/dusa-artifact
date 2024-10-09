import { Data } from '../datastructures/data.js';
import { Pattern } from '../language/terms.js';
export type Substitution = {
    [varName: string]: Data;
};
export declare function match(substitution: Substitution, pattern: Pattern, data: Data): null | Substitution;
export declare function apply(substitution: Substitution, pattern: Pattern): Data;
export declare function equal(t: Data, s: Data): boolean;
