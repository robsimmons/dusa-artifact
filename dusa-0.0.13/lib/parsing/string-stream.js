export function makeStream(baseString, lineNumber, startingColumn) {
    let str = baseString.slice(startingColumn - 1);
    let currentColumn = startingColumn;
    function match(match, advance) {
        if (typeof match === 'string') {
            if (str.startsWith(match)) {
                if (advance) {
                    str = str.slice(match.length);
                    currentColumn += match.length;
                }
                return match;
            }
            return null;
        }
        const found = str.match(match);
        if (!found || found[0] === '') {
            return null;
        }
        if (found.index !== 0) {
            throw new Error(`Misconfigured parser, regexp ${match} does not match only start of line`);
        }
        if (advance) {
            str = str.slice(found[0].length);
            currentColumn += found[0].length;
        }
        return found[0];
    }
    return {
        eat: (m) => match(m, true),
        peek: (m) => match(m, false),
        eatToEol: () => {
            const result = str;
            currentColumn += result.length;
            str = '';
            return result;
        },
        sol: () => currentColumn === 1,
        eol: () => str === '',
        currentColumn: () => currentColumn,
        matchedLocation: () => ({
            start: { line: lineNumber, column: startingColumn },
            end: { line: lineNumber, column: currentColumn },
        }),
    };
}
