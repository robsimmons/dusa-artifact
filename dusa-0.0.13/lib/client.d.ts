import { Stats } from './engine/choiceengine.js';
import { Database } from './engine/forwardengine.js';
import { Issue } from './parsing/parser.js';
import { Fact, InputFact, InputTerm, JsonData, Term } from './termoutput.js';
export type { Term, Fact, InputTerm, InputFact, JsonData } from './termoutput.js';
export { dataToTerm, termToData } from './termoutput.js';
export type { Issue, Stats };
export type { SourcePosition, SourceLocation } from './parsing/source-location.js';
export { DANGER_RESET_DATA } from './datastructures/data.js';
export declare class DusaError extends Error {
    issues: Issue[];
    constructor(issues: Issue[]);
}
export declare class DusaSolution {
    private db;
    constructor(db: Database);
    get facts(): IterableIterator<Fact>;
    lookup(name: string, ...args: InputTerm[]): IterableIterator<Term[]>;
    get(name: string, ...args: InputTerm[]): Term | undefined;
    has(name: string, ...args: InputTerm[]): boolean;
}
export declare class Dusa {
    private program;
    private debug;
    private arities;
    private db;
    private stats;
    private cachedSolution;
    private advanceDb;
    constructor(source: string, debug?: boolean);
    private checkPredicateForm;
    /**
     * Add new facts to the database. These will affect the results of any
     * subsequent solutions.
     */
    assert(...facts: InputFact[]): void;
    /**
     * Insert the structure of a JSON object into the database. If no two-place
     * predicate is provided, these facts will be added with the special built-in
     * predicate `->`, which is represented with (left-associative) infix notation
     * in Dusa.
     */
    load(json: JsonData, pred?: string): Term;
    get solutions(): IterableIterator<DusaSolution>;
    get solution(): DusaSolution | null;
    sample(): DusaSolution | null;
}
