export function termToString(t, needsParens = true) {
    switch (t.type) {
        case 'triv':
            return `()`;
        case 'wildcard':
            return `_`;
        case 'int':
            return `${t.value}`;
        case 'bool':
            return `#${t.value ? 'tt' : 'ff'}`;
        case 'string':
            return `"${t.value}"`;
        case 'const':
        case 'special': {
            const name = t.type === 'const' ? t.name : `${t.symbol}<${t.name}>`;
            return t.args.length === 0
                ? name
                : needsParens
                    ? `(${name} ${t.args.map((arg) => termToString(arg)).join(' ')})`
                    : `${name} ${t.args.map((arg) => termToString(arg)).join(' ')}`;
        }
        case 'var':
            return t.name;
    }
}
export function theseVarsGroundThisPattern(vars, t) {
    switch (t.type) {
        case 'triv':
        case 'int':
        case 'bool':
        case 'string':
            return true;
        case 'wildcard':
            return false;
        case 'const':
        case 'special':
            return t.args.every((arg) => theseVarsGroundThisPattern(vars, arg));
        case 'var':
            return vars.has(t.name);
    }
}
function repeatedWildcardsAccum(wildcards, repeatedWildcards, p) {
    switch (p.type) {
        case 'wildcard':
            if (p.name !== null && wildcards.has(p.name)) {
                repeatedWildcards.set(p.name, p.loc);
            }
            wildcards.add(p.name ?? '_');
            return;
        case 'int':
        case 'string':
        case 'triv':
        case 'var':
            return;
        case 'const':
        case 'special':
            for (const arg of p.args) {
                repeatedWildcardsAccum(wildcards, repeatedWildcards, arg);
            }
            return;
    }
}
export function repeatedWildcards(knownWildcards, ...patterns) {
    const repeatedWildcards = new Map();
    for (const pattern of patterns) {
        repeatedWildcardsAccum(knownWildcards, repeatedWildcards, pattern);
    }
    return [...repeatedWildcards.entries()];
}
function freeVarsAccum(s, p) {
    switch (p.type) {
        case 'var':
            s.add(p.name);
            return;
        case 'int':
        case 'string':
        case 'triv':
        case 'wildcard':
            return;
        case 'const':
        case 'special':
            for (const arg of p.args) {
                freeVarsAccum(s, arg);
            }
            return;
    }
}
export function freeVars(...patterns) {
    const s = new Set();
    for (const pattern of patterns) {
        freeVarsAccum(s, pattern);
    }
    return s;
}
function freeParsedVarsAccum(s, p) {
    switch (p.type) {
        case 'var':
            s.set(p.name, p.loc);
            return;
        case 'int':
        case 'string':
        case 'triv':
        case 'wildcard':
            return;
        case 'const':
        case 'special':
            for (const arg of p.args) {
                freeParsedVarsAccum(s, arg);
            }
            return;
    }
}
export function freeParsedVars(...patterns) {
    const s = new Map();
    for (const pattern of patterns) {
        freeParsedVarsAccum(s, pattern);
    }
    return s;
}
