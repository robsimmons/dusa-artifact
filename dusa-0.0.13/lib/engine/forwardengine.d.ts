import { AttributeMap } from '../datastructures/attributemap.js';
import PQ from '../datastructures/binqueue.js';
import { Data } from '../datastructures/data.js';
import { TrieMap } from '../datastructures/datamap.js';
import { IndexedProgram } from '../language/indexize.js';
type Prefix = {
    type: 'prefix';
    name: string;
    shared: Data[];
    passed: Data[];
};
type NewFact = {
    type: 'fact';
    name: string;
    args: Data[];
    value: Data;
};
type Index = {
    type: 'index';
    name: string;
    shared: Data[];
    introduced: Data[];
};
type Listy<T> = null | {
    data: T;
    next: Listy<T>;
};
type QueueMember = Prefix | Index | NewFact;
export interface Database {
    factValues: TrieMap<Data, {
        type: 'is';
        value: Data;
    } | {
        type: 'is not';
        value: Data[];
    }>;
    prefixes: AttributeMap<Listy<Data[]>>;
    indexes: AttributeMap<Listy<Data[]>>;
    queue: PQ<QueueMember>;
    deferredChoices: AttributeMap<{
        values: Data[];
        exhaustive: boolean;
    }>;
    remainingDemands: AttributeMap<true>;
}
export declare function makeInitialDb(program: IndexedProgram): Database;
/** Imperative: modifies the current database */
export declare function insertFact(name: string, args: Data[], value: Data, db: Database): boolean;
/** Functional: does not modify the provided database */
export declare function stepDb(program: IndexedProgram, db: Database): Database | null;
export declare function listFacts(db: Database): IterableIterator<{
    name: string;
    args: Data[];
    value: Data;
}>;
export declare function lookup(db: Database, name: string, args: Data[]): IterableIterator<{
    args: Data[];
    value: Data;
}>;
export declare function get(db: Database, name: string, args: Data[]): undefined | Data;
export declare function queueToString(db: Database): string;
/** Warning: VERY inefficient */
export declare function dbToString(db: Database): string;
export {};
