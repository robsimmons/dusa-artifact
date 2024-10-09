/* Source locations */
export function positionLt(p1, p2) {
    if (p1.line < p2.line)
        return true;
    if (p1.line > p2.line)
        return false;
    return p1.line < p2.line ? true : p1.line > p2.line ? false : p1.column < p2.column;
}
export function unionLocations(loc, ...others) {
    const span = { ...loc };
    others.map((other) => {
        if (other !== null) {
            if (positionLt(other.start, span.start)) {
                span.start = other.start;
            }
            if (positionLt(span.end, other.end)) {
                span.end = other.end;
            }
        }
    });
    return span;
}
