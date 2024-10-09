export interface SourcePosition {
    line: number;
    column: number;
}
export interface SourceLocation {
    start: SourcePosition;
    end: SourcePosition;
}
export declare function positionLt(p1: SourcePosition, p2: SourcePosition): boolean;
export declare function unionLocations(loc: SourceLocation, ...others: (SourceLocation | null)[]): SourceLocation;
