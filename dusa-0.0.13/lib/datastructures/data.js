let nextRef = -1;
let views = [
    { type: 'triv' },
    { type: 'bool', value: true },
    { type: 'bool', value: false },
];
let strings = {};
let structures = {};
export function DANGER_RESET_DATA() {
    nextRef = -1;
    views = [{ type: 'triv' }, { type: 'bool', value: true }, { type: 'bool', value: false }];
    strings = {};
    structures = {};
}
export const TRIV_DATA = 0;
export const BOOL_TRUE = 1;
export const BOOL_FALSE = 2;
export function expose(d) {
    if (typeof d === 'bigint')
        return { type: 'int', value: d };
    if (d <= nextRef)
        throw new Error(`Internalized ref ${-d} too small.`);
    if (d < 0)
        return { type: 'ref', value: -d };
    if (d >= views.length)
        throw new Error(`Internalized value ${d} invalid`);
    return views[d];
}
function getStructureIndex(name, args) {
    let structure = structures[name];
    for (const arg of args) {
        if (structure === undefined)
            return null;
        if (typeof arg === 'bigint')
            structure = structure.bigintChildren[`${arg}`];
        else
            structure = structure.indexChildren[arg];
    }
    if (structure?.value === undefined)
        return null;
    return structure.value;
}
function setStructureIndex(name, args, value) {
    if (!structures[name]) {
        structures[name] = { bigintChildren: {}, indexChildren: {} };
    }
    let structure = structures[name];
    for (const arg of args) {
        if (typeof arg === 'bigint') {
            const index = `${arg}`;
            if (!structure.bigintChildren[index]) {
                structure.bigintChildren[index] = { bigintChildren: {}, indexChildren: {} };
            }
            structure = structure.bigintChildren[index];
        }
        else {
            if (!structure.indexChildren[arg]) {
                structure.indexChildren[arg] = { bigintChildren: {}, indexChildren: {} };
            }
            structure = structure.indexChildren[arg];
        }
    }
    if (structure.value !== undefined)
        throw new Error(`Invariant, setting an existing structure`);
    structure.value = value;
}
export function hide(d) {
    switch (d.type) {
        case 'triv':
            return 0;
        case 'int':
            return d.value;
        case 'bool':
            return d.value ? 1 : 2;
        case 'ref':
            if (-d.value <= nextRef || d.value >= 0) {
                throw new Error(`Ref value is invalid`);
            }
            return -d.value;
        case 'string': {
            const candidate = strings[d.value];
            if (candidate)
                return candidate;
            const result = views.length;
            views.push({ type: 'string', value: d.value });
            strings[d.value] = result;
            return result;
        }
        case 'const': {
            const candidate = getStructureIndex(d.name, d.args);
            if (candidate !== null)
                return candidate;
            const result = views.length;
            views.push({ type: 'const', name: d.name, args: d.args });
            setStructureIndex(d.name, d.args, result);
            return result;
        }
    }
}
export function compareData(a, b) {
    const x = expose(a);
    const y = expose(b);
    switch (x.type) {
        case 'triv':
            if (y.type === 'triv')
                return 0;
            return -1;
        case 'int':
            if (y.type === 'triv')
                return 1;
            if (y.type === 'int') {
                const c = x.value - y.value;
                return c > 0n ? 1 : c < 0n ? -1 : 0;
            }
            return -1;
        case 'bool':
            if (y.type === 'triv' || y.type === 'int')
                return 1;
            if (y.type === 'bool')
                return (x.value ? 1 : 0) - (y.value ? 1 : 0);
            return -1;
        case 'ref':
            if (y.type === 'triv' || y.type === 'int' || y.type === 'bool')
                return 1;
            if (y.type === 'ref')
                return x.value - y.value;
            return -1;
        case 'string':
            if (y.type === 'triv' || y.type === 'int' || y.type === 'bool' || y.type === 'ref')
                return 1;
            if (y.type === 'string')
                return x.value > y.value ? 1 : x.value < y.value ? -1 : 0;
            return -1;
        case 'const':
            if (y.type !== 'const')
                return 1;
            if (x.name > y.name)
                return 1;
            if (x.name < y.name)
                return -1;
            if (x.args.length !== y.args.length)
                return x.args.length - y.args.length;
            for (let i = 0; i < x.args.length; i++) {
                const c = compareData(x.args[i], y.args[i]);
                if (c !== 0)
                    return c;
            }
            return 0;
    }
}
export function escapeString(input) {
    const escaped = [];
    let i = 0;
    while (i < input.length) {
        if (input.codePointAt(i) > 0xffff) {
            escaped.push(`\\u{${input.codePointAt(i).toString(16)}}`);
            i += 2;
        }
        else {
            const ch = input.charAt(i);
            if (ch.charCodeAt(0) > 0xff) {
                escaped.push(`\\u{${input.charCodeAt(i).toString(16)}}`);
            }
            else if (ch.match(/[ !#-[\]-~]/)) {
                escaped.push(ch);
            }
            else if (ch === '\\') {
                escaped.push('\\\\');
            }
            else if (ch === '"') {
                escaped.push('\\"');
            }
            else if (ch === '\n') {
                escaped.push('\\n');
            }
            else if (ch.charCodeAt(0) >= 16) {
                escaped.push(`\\x${input.charCodeAt(i).toString(16)}`);
            }
            else {
                escaped.push(`\\x0${input.charCodeAt(i).toString(16)}`);
            }
            i += 1;
        }
    }
    return escaped.join('');
}
export function dataToString(d, needsParens = true) {
    const view = expose(d);
    switch (view.type) {
        case 'triv':
            return `()`;
        case 'int':
            return `${view.value}`;
        case 'bool':
            return `#${view.value ? 'tt' : 'ff'}`;
        case 'ref':
            return `#${view.value}`;
        case 'string': {
            return `"${escapeString(view.value)}"`;
        }
        case 'const':
            return view.args.length === 0
                ? view.name
                : needsParens
                    ? `(${view.name} ${view.args.map((arg) => dataToString(arg)).join(' ')})`
                    : `${view.name} ${view.args.map((arg) => dataToString(arg)).join(' ')}`;
    }
}
export function getRef() {
    return nextRef--;
}
