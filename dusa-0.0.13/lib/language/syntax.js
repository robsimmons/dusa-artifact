import { freeVars, termToString } from './terms.js';
export function propToString(p) {
    const args = p.args.map((arg) => ` ${termToString(arg)}`).join('');
    const value = p.value === null || p.value.type === 'triv' ? '' : ` is ${termToString(p.value)}`;
    return `${p.name}${args}${value}`;
}
export function headToString(head) {
    const args = head.args.map((arg) => ` ${termToString(arg)}`).join('');
    if (head.values === null) {
        return `${head.name}${args}`;
    }
    else if (head.values.length !== 1) {
        return `${head.name}${args} ${head.exhaustive ? 'is' : 'is?'} { ${head.values
            .map((term) => termToString(term, false))
            .join(', ')} }`;
    }
    else if (head.values[0].type === 'triv' && head.exhaustive) {
        return `${head.name}${args}`;
    }
    else {
        return `${head.name}${args} ${head.exhaustive ? 'is' : 'is?'} ${termToString(head.values[0], false)}`;
    }
}
function premiseToString(premise) {
    switch (premise.type) {
        case 'Equality':
            return `${termToString(premise.a)} == ${termToString(premise.b)}`;
        case 'Inequality':
            return `${termToString(premise.a)} != ${termToString(premise.b)}`;
        case 'Gt':
            return `${termToString(premise.a)} > ${termToString(premise.b)}`;
        case 'Geq':
            return `${termToString(premise.a)} >= ${termToString(premise.b)}`;
        case 'Lt':
            return `${termToString(premise.a)} < ${termToString(premise.b)}`;
        case 'Leq':
            return `${termToString(premise.a)} <= ${termToString(premise.b)}`;
        case 'Proposition':
            return propToString(premise);
    }
}
export function freeVarsPremise(premise) {
    switch (premise.type) {
        case 'Equality':
        case 'Inequality':
        case 'Gt':
        case 'Geq':
        case 'Lt':
        case 'Leq':
            return freeVars(premise.a, premise.b);
        case 'Proposition':
            if (premise.value === null) {
                return freeVars(...premise.args);
            }
            else {
                return freeVars(...premise.args, premise.value);
            }
    }
}
export function declToString(decl) {
    switch (decl.type) {
        case 'Forbid':
            return `#forbid ${decl.premises.map(premiseToString).join(', ')}.`;
        case 'Demand':
            return `#demand ${decl.premises.map(premiseToString).join(', ')}.`;
        case 'Rule':
            if (decl.premises.length === 0) {
                return `${headToString(decl.conclusion)}.`;
            }
            return `${headToString(decl.conclusion)} :- ${decl.premises
                .map(premiseToString)
                .join(', ')}.`;
    }
}
export function* visitPropsInProgram(decls) {
    for (const decl of decls) {
        if (decl.type === 'Rule') {
            yield decl.conclusion;
        }
        if (decl.type === 'Demand' || decl.type === 'Forbid' || decl.type === 'Rule') {
            for (const premise of decl.premises) {
                if (premise.type === 'Proposition') {
                    yield premise;
                }
            }
        }
    }
}
export function* visitSubterms(...terms) {
    for (const term of terms) {
        yield term;
        switch (term.type) {
            case 'special':
            case 'const':
                for (const subterm of term.args) {
                    yield* visitSubterms(subterm);
                }
        }
    }
}
export function* visitTermsInPremises(...premises) {
    for (const premise of premises) {
        if (premise.type === 'Proposition') {
            for (const term of premise.args) {
                yield* visitSubterms(term);
            }
            if (premise.value) {
                yield* visitSubterms(premise.value);
            }
        }
        else {
            yield* visitSubterms(premise.a);
            yield* visitSubterms(premise.b);
        }
    }
}
export function* visitTermsinProgram(decls) {
    for (const decl of decls) {
        if (decl.type === 'Rule') {
            for (const term of decl.conclusion.args) {
                yield* visitSubterms(term);
            }
            for (const term of decl.conclusion.values ?? []) {
                yield* visitSubterms(term);
            }
        }
        if (decl.type === 'Demand' || decl.type === 'Forbid' || decl.type === 'Rule') {
            yield* visitTermsInPremises(...decl.premises);
        }
    }
}
