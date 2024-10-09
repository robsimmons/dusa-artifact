import { checkPropositionArity } from './check.js';
import { freeVarsPremise, headToString, } from './syntax.js';
import { termToString, theseVarsGroundThisPattern } from './terms.js';
/*
 * The flattening transformation picks the order in which built-in terms and which functonal
 * propositions in term position will be sequenced, and also turns syntactically supported
 * built-ins (like == and !=) into their supported form as built-in functional propositions.
 *
 * This is relatively straightforward for built-ins where all arguments are grounded by the
 * time the built-in is encountered: the function calls will be placed immediately prior to
 * the premise.
 *
 * In this example:
 *
 *     #demand f X, g (s (s X)) Y, h X (s Y).
 *
 * This needs to get flattend to:
 *
 *     #demand f X, s X is #1, s #1 is #2, g #2 Y, s Y is #3, h X #3.
 *
 * However, some built-in functions (NAT_SUCC, INT_PLUS, INT_MINUS, STRING_CONCAT) allow for
 * a distinguished "match" argument that can be resolved afterwards. In those cases, the
 *
 *     #demand f Y, g (s (s X)) Y, h X (s Z).
 *
 * This needs to get transformed to:
 *
 *     #demand f X, g #1 is Y, s |#2| is #1, s |X| is #2, h X #3, s |Z| is #3.
 *
 * to allow the checks to be run after the fact. (The pipes are used here to offset the
 * argument in the distinguished match location.)
 */
/**
 * When a pattern is grounded, we want to run any built-in functions or check
 * any functional predicates before trying to calculate the ground term.
 */
function flattenGroundPattern(preds, counter, parsedPattern) {
    switch (parsedPattern.type) {
        case 'triv':
        case 'int':
        case 'bool':
        case 'string':
        case 'wildcard': // Impossible
        case 'var':
            return { before: [], pattern: parsedPattern };
        case 'const':
        case 'special': {
            const before = [];
            const args = [];
            for (const arg of parsedPattern.args) {
                const sub = flattenGroundPattern(preds, counter, arg);
                before.push(...sub.before);
                args.push(sub.pattern);
            }
            if (parsedPattern.type === 'special' || preds.has(parsedPattern.name)) {
                const replacementVar = `#${counter.current++}`;
                before.push(parsedPattern.type === 'special'
                    ? {
                        type: 'Builtin',
                        name: parsedPattern.name,
                        symbol: parsedPattern.symbol,
                        args,
                        value: { type: 'var', name: replacementVar },
                        matchPosition: null,
                        loc: parsedPattern.loc,
                    }
                    : {
                        type: 'Proposition',
                        name: parsedPattern.name,
                        args,
                        value: { type: 'var', name: replacementVar },
                        loc: parsedPattern.loc,
                    });
                return { before, pattern: { type: 'var', name: replacementVar } };
            }
            return { before, pattern: { type: 'const', name: parsedPattern.name, args } };
        }
    }
}
/**
 * When a pattern is definitely NOT grounded and we encounter a (supported) functional
 * predicate or a built-in, we replace the term with a new variable and do remaining
 * matching later.
 */
function flattenNonGroundPattern(preds, counter, boundVars, parsedPattern) {
    switch (parsedPattern.type) {
        case 'triv':
        case 'int':
        case 'bool':
        case 'string':
        case 'wildcard':
        case 'var':
            return { before: [], after: [], pattern: parsedPattern };
        case 'const': {
            const before = [];
            const after = [];
            const args = [];
            for (const arg of parsedPattern.args) {
                if (theseVarsGroundThisPattern(boundVars, arg)) {
                    const sub = flattenGroundPattern(preds, counter, arg);
                    before.push(...sub.before);
                    args.push(sub.pattern);
                }
                else {
                    const sub = flattenNonGroundPattern(preds, counter, boundVars, arg);
                    before.push(...sub.before);
                    after.push(...sub.after);
                    args.push(sub.pattern);
                }
            }
            if (!preds.has(parsedPattern.name)) {
                return { before, after, pattern: { type: 'const', name: parsedPattern.name, args } };
            }
            else {
                const replacementVar = `#${counter.current++}`;
                return {
                    before: [],
                    after: [
                        ...before,
                        {
                            type: 'Proposition',
                            name: parsedPattern.name,
                            args,
                            value: { type: 'var', name: replacementVar },
                            loc: parsedPattern.loc,
                        },
                        ...after,
                    ],
                    pattern: { type: 'var', name: replacementVar },
                };
            }
        }
        case 'special': {
            // Exactly one of the subterms must be non-ground
            const nonGroundIndex = parsedPattern.args.findIndex((arg) => !theseVarsGroundThisPattern(boundVars, arg));
            const replacementVar = `#${counter.current++}`;
            const before = [];
            const args = [];
            const nonGroundSubterm = flattenNonGroundPattern(preds, counter, boundVars, parsedPattern.args[nonGroundIndex]);
            for (const [i, arg] of parsedPattern.args.entries()) {
                if (i !== nonGroundIndex) {
                    const sub = flattenGroundPattern(preds, counter, arg);
                    args.push(sub.pattern);
                    before.push(...sub.before);
                }
                else {
                    args.push(nonGroundSubterm.pattern);
                }
            }
            return {
                pattern: { type: 'var', name: replacementVar },
                before,
                after: [
                    ...nonGroundSubterm.before,
                    {
                        type: 'Builtin',
                        name: parsedPattern.name,
                        symbol: parsedPattern.symbol,
                        args,
                        value: { type: 'var', name: replacementVar },
                        matchPosition: nonGroundIndex,
                        loc: parsedPattern.loc,
                    },
                    ...nonGroundSubterm.after,
                ],
            };
        }
    }
}
function flattenPattern(preds, counter, boundVars, pattern) {
    if (theseVarsGroundThisPattern(boundVars, pattern)) {
        return { ...flattenGroundPattern(preds, counter, pattern), after: [] };
    }
    else {
        return flattenNonGroundPattern(preds, counter, boundVars, pattern);
    }
}
function flattenPremise(preds, counter, boundVars, premise) {
    switch (premise.type) {
        case 'Proposition': {
            const before = [];
            const after = [];
            const args = [];
            for (const arg of premise.args) {
                const argResult = flattenPattern(preds, counter, boundVars, arg);
                before.push(...argResult.before);
                after.push(...argResult.after);
                args.push(argResult.pattern);
            }
            const valueResult = premise.value === null
                ? { pattern: { type: 'triv' }, before: [], after: [] }
                : flattenPattern(preds, counter, boundVars, premise.value);
            before.push(...valueResult.before);
            after.push(...valueResult.after);
            return [
                ...before,
                {
                    type: 'Proposition',
                    name: premise.name,
                    args,
                    value: valueResult.pattern,
                    loc: premise.loc,
                },
                ...after,
            ];
        }
        case 'Gt':
        case 'Geq':
        case 'Lt':
        case 'Leq':
        case 'Equality':
        case 'Inequality': {
            const matchPosition = !theseVarsGroundThisPattern(boundVars, premise.a)
                ? 0
                : !theseVarsGroundThisPattern(boundVars, premise.b)
                    ? 1
                    : null;
            const aResult = flattenPattern(preds, counter, boundVars, premise.a);
            const bResult = flattenPattern(preds, counter, boundVars, premise.b);
            const name = premise.type === 'Leq' || premise.type === 'Gt'
                ? 'GT'
                : premise.type === 'Lt' || premise.type === 'Geq'
                    ? 'GEQ'
                    : 'EQUAL';
            const value = premise.type === 'Geq' || premise.type === 'Gt' || premise.type === 'Equality';
            return [
                ...aResult.before,
                ...bResult.before,
                {
                    type: 'Builtin',
                    name,
                    symbol: null,
                    args: [aResult.pattern, bResult.pattern],
                    value: { type: 'bool', value },
                    matchPosition: matchPosition,
                    loc: premise.loc,
                },
                ...aResult.after,
                ...bResult.after,
            ];
        }
    }
}
function flattenDecl(preds, decl) {
    const counter = { current: 1 };
    const boundVars = new Set();
    const premises = [];
    for (const premise of decl.premises) {
        premises.push(...flattenPremise(preds, counter, boundVars, premise));
        for (const v of freeVarsPremise(premise)) {
            boundVars.add(v);
        }
    }
    switch (decl.type) {
        case 'Demand':
        case 'Forbid':
            return { type: decl.type, loc: decl.loc, premises };
        case 'Rule': {
            const args = [];
            for (const arg of decl.conclusion.args) {
                const result = flattenGroundPattern(preds, counter, arg);
                args.push(result.pattern);
                premises.push(...result.before);
            }
            const values = [];
            if (decl.conclusion.values === null) {
                values.push({ type: 'triv' });
            }
            else {
                for (const value of decl.conclusion.values) {
                    const result = flattenGroundPattern(preds, counter, value);
                    values.push(result.pattern);
                    premises.push(...result.before);
                }
            }
            return {
                type: 'Rule',
                premises,
                conclusion: {
                    name: decl.conclusion.name,
                    args,
                    values,
                    exhaustive: decl.conclusion.exhaustive,
                    loc: decl.conclusion.loc,
                },
                loc: decl.loc,
            };
        }
    }
}
export function indexToRuleName(index) {
    if (index >= 26) {
        return `${indexToRuleName(Math.floor(index / 26))}${String.fromCharCode(97 + (index % 26))}`;
    }
    return String.fromCharCode(97 + index);
}
export function flattenAndName(decls) {
    const arityInfo = checkPropositionArity(decls);
    if (arityInfo.issues !== null) {
        throw new Error('Invariant violation: flattenAndName called with bad program');
    }
    const preds = new Set(Object.keys(arityInfo.arities));
    const flatDecls = [];
    for (const [index, decl] of decls.entries()) {
        flatDecls.push([indexToRuleName(index), flattenDecl(preds, decl)]);
    }
    return flatDecls;
}
export function flatPremiseToString(premise) {
    const args = premise.args.map((arg) => termToString(arg));
    const value = termToString(premise.value);
    switch (premise.type) {
        case 'Builtin': {
            if (premise.matchPosition !== null) {
                args[premise.matchPosition] = `|${args[premise.matchPosition]}|`;
            }
            const name = premise.symbol === null ? premise.name : `${premise.symbol}/${premise.name}`;
            return `${name}${args.map((arg) => ` ${arg}`).join('')} is ${value}`;
        }
        case 'Proposition': {
            return `${premise.name}${args.map((arg) => ` ${arg}`).join('')} is ${value}`;
        }
    }
}
export function flatDeclToString([name, decl]) {
    const premises = decl.premises.map(flatPremiseToString).join(', ');
    switch (decl.type) {
        case 'Forbid':
            return `${name}: #forbid ${premises}.`;
        case 'Demand':
            return `${name}: #forbid ${premises}.`;
        case 'Rule':
            if (decl.premises.length === 0) {
                return `${name}: ${headToString(decl.conclusion)}.`;
            }
            return `${name}: ${headToString(decl.conclusion)} :- ${premises}.`;
    }
}
export function flatProgramToString(flatProgram) {
    return flatProgram.map(flatDeclToString).join('\n');
}
