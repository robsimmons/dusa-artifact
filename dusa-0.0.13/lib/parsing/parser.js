import { makeStream } from './string-stream.js';
/** Parse a document with the stream parser. */
export function parseWithStreamParser(parser, str) {
    const lines = str.split('\n');
    let state = parser.startState;
    const output = [];
    const issues = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let currentColumn = 1;
        do {
            const stream = makeStream(line, i + 1, currentColumn);
            const response = parser.advance(stream, state);
            state = response.state;
            if (response.tree) {
                output.push(response.tree);
            }
            if (response.issues) {
                issues.push(...response.issues);
            }
            currentColumn = stream.currentColumn();
        } while (currentColumn <= line.length);
    }
    for (;;) {
        const response = parser.handleEof(state);
        if (!response) {
            break;
        }
        state = response.state;
        if (response.tree) {
            output.push(response.tree);
        }
        if (response.issues) {
            issues.push(...response.issues);
        }
    }
    return { issues, document: output };
}
