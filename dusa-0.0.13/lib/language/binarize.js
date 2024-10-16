import { flatPremiseToString } from './flatten.js';
import { freeVars, termToString } from './terms.js';
/**
 * Binarization transformation
 *
 * The binarization transformation is straightforward in implementation and
 * concept. A rule of this form:
 *
 *     a: C :- P0, P2, ... Pn.
 *
 * is turned into a series of rule n+1 rules, each with either one or two premises:
 *
 *     $a1 <vars> :- $a0, P0.
 *     ...
 *     $a(i+1) <vars> :- $ai <vars>, Pi.
 *     ...
 *     C :- $a(n+1).
 */
export function freeVarsBinarizedPremise(premise) {
    return freeVars(...premise.args, premise.value);
}
function binarizedRuleToString(rule) {
    switch (rule.type) {
        case 'Binary':
            return `$${rule.outName}${rule.outVars.map((v) => ` ${v}`).join('')} :- $${rule.inName}${rule.inVars.map((v) => ` ${v}`).join('')}, ${flatPremiseToString(rule.premise)}.`;
        case 'Conclusion':
            return `${rule.name}${rule.args
                .map((arg) => ` ${termToString(arg)}`)
                .join('')} is { ${rule.values.map((arg) => termToString(arg)).join(', ')}${rule.exhaustive ? '' : '?'} } :- $${rule.inName}${rule.inVars.map((v) => ` ${v}`).join('')}.`;
    }
}
export function binarizedProgramToString(program) {
    return `Initial seeds: ${program.seeds.map((name) => `$${name}`).join(', ')}
Demands to derive: ${program.demands.map((name) => `$${name}`).join(', ')}
Forbids to derive: ${program.forbids.map((name) => `$${name}`).join(', ')}
Rules:
${program.rules.map((rule) => binarizedRuleToString(rule)).join('\n')}`;
}
function binarizePremises(name, premises, liveVars) {
    const knownLiveVarsArr = Array.from({ length: premises.length });
    const workingLiveVars = new Set(liveVars);
    for (let i = premises.length - 1; i >= 0; i--) {
        knownLiveVarsArr[i] = new Set(workingLiveVars);
        for (const v of freeVars(...premises[i].args, premises[i].value)) {
            workingLiveVars.add(v);
        }
    }
    const knownFreeVars = new Set();
    let knownCarriedVars = [];
    const totalPremises = premises.length;
    const newRules = premises.map((premise, premiseNumber) => {
        const inName = `${name}${premiseNumber}`;
        const outName = `${name}${premiseNumber + 1}`;
        const inVars = [...knownCarriedVars];
        for (const v of freeVars(...premise.args, premise.value)) {
            if (!knownFreeVars.has(v)) {
                knownCarriedVars.push(v);
                knownFreeVars.add(v);
            }
        }
        knownCarriedVars = knownCarriedVars.filter((v) => knownLiveVarsArr[premiseNumber].has(v));
        return {
            type: 'Binary',
            premise: premise,
            inName,
            inVars,
            outName,
            outVars: [...knownCarriedVars],
            premiseNumber,
            totalPremises,
        };
    });
    return {
        seed: `${name}0`,
        conclusion: `${name}${premises.length}`,
        newRules,
        carriedVars: knownCarriedVars.filter((v) => liveVars.has(v)),
    };
}
export function binarize(decls) {
    const seeds = [];
    const rules = [];
    const forbids = [];
    const demands = [];
    for (const [name, decl] of decls) {
        switch (decl.type) {
            case 'Forbid': {
                const { seed, newRules, conclusion } = binarizePremises(name, decl.premises, new Set());
                seeds.push(seed);
                rules.push(...newRules);
                forbids.push(conclusion);
                break;
            }
            case 'Demand': {
                const { seed, newRules, conclusion } = binarizePremises(name, decl.premises, new Set());
                seeds.push(seed);
                rules.push(...newRules);
                demands.push(conclusion);
                break;
            }
            case 'Rule': {
                const { seed, newRules, conclusion, carriedVars } = binarizePremises(name, decl.premises, freeVars(...decl.conclusion.args, ...(decl.conclusion.values ?? [])));
                seeds.push(seed);
                rules.push(...newRules, {
                    type: 'Conclusion',
                    inName: conclusion,
                    inVars: carriedVars,
                    name: decl.conclusion.name,
                    args: decl.conclusion.args,
                    values: decl.conclusion.values ?? [{ type: 'triv' }],
                    exhaustive: decl.conclusion.exhaustive,
                });
            }
        }
    }
    return { seeds, rules, forbids, demands };
}
