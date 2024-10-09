import { BUILT_IN_PRED } from '../language/dusa-builtins.js';
import { Data } from '../datastructures/data.js';
import { Substitution } from './dataterm.js';
import { Pattern } from '../language/terms.js';
export declare function runBuiltinBackward(pred: BUILT_IN_PRED, prefix: Data[], matchPosition: Pattern, postfix: Data[], value: Data, substitution: Substitution): IterableIterator<Substitution>;
export declare function runBuiltinForward(pred: BUILT_IN_PRED, args: Data[]): Data | null;
