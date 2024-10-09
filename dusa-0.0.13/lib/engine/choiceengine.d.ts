import { Data } from '../datastructures/data.js';
import { DataMap } from '../datastructures/datamap.js';
import { Database } from './forwardengine.js';
import { IndexedProgram } from '../language/indexize.js';
export interface ChoiceTreeLeaf {
    type: 'leaf';
    db: Database;
}
export interface ChoiceTreeNode {
    type: 'choice';
    base: Database;
    attribute: [string, Data[]];
    children: DataMap<null | ChoiceTree>;
    defer: 'exhaustive' | ChoiceTree;
}
export type ChoiceTree = ChoiceTreeLeaf | ChoiceTreeNode;
export interface Stats {
    cycles: number;
    deadEnds: number;
}
export declare function stepTreeRandomDFS(program: IndexedProgram, tree: ChoiceTree, path: [ChoiceTreeNode, Data | 'defer'][], stats: Stats): {
    tree: ChoiceTree;
    path: [ChoiceTreeNode, Data | 'defer'][];
    solution?: Database;
} | {
    tree: null;
    solution?: Database;
};
/**** Debugging ****/
interface Fact {
    name: string;
    args: Data[];
    value: Data;
}
interface Solution {
    facts: Fact[];
}
export declare function execute(program: IndexedProgram, db: Database, debug?: boolean): {
    solutions: Solution[];
    steps: number;
    deadEnds: number;
};
export declare function pathToString(tree: ChoiceTree, path: [ChoiceTreeNode, Data | 'defer'][]): string;
export declare function factToString(fact: Fact): string;
export declare function solutionsToStrings(solutions: Solution[]): string[];
export {};
