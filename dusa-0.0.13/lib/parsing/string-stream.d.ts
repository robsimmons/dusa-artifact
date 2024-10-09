import { SourceLocation } from './source-location.js';
/** Simplified variant of the Codemirror StringStream.
 *
 * https://codemirror.net/docs/ref/#language.StringStream
 *
 * Designed to be passed to the advance() function of a StreamParser.
 */
export interface StringStream {
    /** Matches a string or a regexp (which must start with ^ to only
     * match the start of the string) and advances the current position
     * if found. Returns a non-empty matched string, or null.
     */
    eat(match: string | RegExp): string | null;
    /** Same as eat(), but doesn't advance the current position. */
    peek(match: string | RegExp): string | null;
    /** Eats to the end of the line and returns the matched string,
     * possibly the empty string if at eol().
     */
    eatToEol(): string;
    /** True if at the start of a line. */
    sol(): boolean;
    /** True if at the end of a line. */
    eol(): boolean;
    /** Returns the SourceLocation covered since the streamstring
     * was initialized (which, in the stream parser, always happens
     * immediately before advance() is called).
     */
    matchedLocation(): SourceLocation;
}
export interface ExtendedStringStream extends StringStream {
    currentColumn(): number;
}
export declare function makeStream(baseString: string, lineNumber: number, startingColumn: number): ExtendedStringStream;
