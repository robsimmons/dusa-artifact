import { StringStream } from './string-stream.js';
import { SourceLocation } from './source-location.js';
export interface StreamParser<State, Tree> {
    startState: State;
    /** Called to advance the stream state and the parser state.
     *
     * Will be called exactly once on an empty line. Except in that
     * case, stream.eol() will never be true when this function is
     * initially called.
     */
    advance(stream: StringStream, state: State): ParserResponse<State, Tree>;
    /** Once the end of the file is reached, this function is called
     * repeatedly until it returns null in order for any cleanup
     * needed to happen.
     */
    handleEof(state: State): null | ParserResponse<State, Tree>;
}
export type Tag = string;
export interface Issue {
    type: 'Issue';
    msg: string;
    severity: 'warning' | 'error';
    loc?: SourceLocation;
}
export interface ParserResponse<State, Tree> {
    state: State;
    tag?: Tag;
    tree?: Tree;
    issues?: Issue[];
}
/** Parse a document with the stream parser. */
export declare function parseWithStreamParser<State, Tree>(parser: StreamParser<State, Tree>, str: string): {
    issues: Issue[];
    document: Tree[];
};
