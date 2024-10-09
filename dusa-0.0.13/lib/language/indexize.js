import { freeVarsBinarizedPremise } from './binarize.js';
import { flatPremiseToString } from './flatten.js';
import { termToString } from './terms.js';
function indexedRuleToString(rule) {
    function lookup([location, index]) {
        if (location === 'shared')
            return rule.shared[index];
        if (location === 'introduced')
            return rule.introduced[index];
        if (location === 'passed')
            return rule.passed[index];
        return location; // location has type never
    }
    const premiseStr = rule.type === 'IndexLookup'
        ? `$${rule.indexName}index [ ${rule.shared.join(', ')} ] [ ${rule.introduced.join(', ')} ]`
        : flatPremiseToString(rule);
    return `$${rule.outName}prefix [ ${rule.outShared.map(lookup).join(', ')} ] [ ${rule.outPassed
        .map(lookup)
        .join(', ')} ] :- $${rule.inName}prefix [ ${rule.shared.join(', ')} ] [ ${rule.passed.join(', ')} ], ${premiseStr}.\n`;
}
function indexInsertionRuleToString(rule) {
    return `$${rule.indexName}index [ ${rule.shared.join(', ')} ] [ ${rule.introduced.join(', ')} ] :- ${rule.name}${rule.args.map((arg) => ` ${termToString(arg)}`).join('')} is ${termToString(rule.value)}.\n`;
}
function conclusionRuleToString(rule) {
    return `${rule.name}${rule.args.map((arg) => ` ${termToString(arg)}`)} is { ${rule.values
        .map((value) => termToString(value))
        .join(', ')}${rule.exhaustive ? '' : '?'} } :- $${rule.inName}prefix [  ] [ ${rule.inVars.join(', ')} ].\n`;
}
export function indexedProgramToString(program) {
    return `Initial seeds: ${program.seeds.map((name) => `$${name}prefix`).join(', ')}
Demands to derive: ${[...program.demands].map((name) => `$${name}prefix`).join(', ')}
Forbids to derive: ${[...program.forbids].map((name) => `$${name}prefix`).join(', ')}
Index insertion rules:
${program.indexInsertionRules.map((rule) => indexInsertionRuleToString(rule)).join('')}
Binary rules:
${program.binaryRules.map((rule) => indexedRuleToString(rule)).join('')}
Conclusion rules:
${program.conclusionRules.map((rule) => conclusionRuleToString(rule)).join('')}`;
}
export function indexize(program) {
    // Figure out which positions of each introduced predicate are keys
    const ruleIndexing = {};
    const conclusionRules = [];
    const pseudoConclusions = new Set([...program.demands, ...program.forbids]);
    for (const rule of program.rules) {
        if (rule.type === 'Conclusion') {
            conclusionRules.push({
                inName: rule.inName,
                inVars: rule.inVars,
                name: rule.name,
                args: rule.args,
                values: rule.values,
                exhaustive: rule.exhaustive,
            });
            ruleIndexing[rule.inName] = {
                shared: [],
                introduced: [],
                passed: rule.inVars,
                permutation: rule.inVars.map((_, index) => ({ position: 'passed', index })),
            };
        }
        else {
            const fv = freeVarsBinarizedPremise(rule.premise);
            const inVars = new Set(rule.inVars);
            const outVars = new Set(rule.outVars);
            const shared = [];
            const introduced = [];
            const passed = [];
            for (const v of rule.inVars) {
                if (!fv.has(v)) {
                    passed.push(v);
                }
            }
            // Create an index predicate $aNright (shared variables) (introduced variables)
            for (const v of fv) {
                if (inVars.has(v)) {
                    shared.push(v);
                }
                else if (outVars.has(v)) {
                    introduced.push(v);
                }
            }
            // We have to permute the arguments to $aN so that the shared variables
            // come first, and in the same order they come for $aNright
            const permutation = [];
            let nextPassedThrough = 0;
            for (const v of rule.inVars) {
                const index = shared.findIndex((sh) => v === sh);
                if (index === -1) {
                    permutation.push({ position: 'passed', index: nextPassedThrough++ });
                }
                else {
                    permutation.push({ position: 'shared', index });
                }
            }
            ruleIndexing[rule.inName] = { shared, introduced, passed, permutation };
        }
    }
    const indexes = [];
    const indexInsertionRules = [];
    const binaryRules = [];
    for (const rule of program.rules) {
        if (rule.type === 'Binary') {
            let outVars = rule.outVars;
            const inPrefixIndexing = ruleIndexing[rule.inName];
            const outPrefixIndexing = ruleIndexing[rule.outName];
            const lookup = (v) => {
                let index;
                if ((index = inPrefixIndexing.shared.findIndex((v2) => v === v2)) !== -1) {
                    return ['shared', index];
                }
                if ((index = inPrefixIndexing.passed.findIndex((v2) => v === v2)) !== -1) {
                    return ['passed', index];
                }
                if ((index = inPrefixIndexing.introduced.findIndex((v2) => v === v2)) !== -1) {
                    return ['introduced', index];
                }
                throw new Error(`Could not find ${v} in lookup`);
            };
            // For pseudorules, we override any variables and just
            // have the conclusion be zero-ary. That's not the only option, but it
            // felt easier than figuring out how to correctly order the rules.
            if (!outPrefixIndexing) {
                if (!pseudoConclusions.has(rule.outName)) {
                    throw new Error(`No outPrefix for ${rule.outName}`);
                }
                outVars = [];
            }
            /* The new conclusion will have outPrefixIndexing.shared.length arguments in the
             * "shared" position, and outPrefixIndexing.passed.length arguments in the
             * "passed" position. These two arrays form the placeholders for the shared
             * and passed arguments of tne new proposition. */
            const outShared = Array.from({
                length: outPrefixIndexing?.shared.length ?? 0,
            });
            const outPassed = Array.from({
                length: outPrefixIndexing?.passed.length ?? 0,
            });
            for (const [index, v] of outVars.entries()) {
                const destination = outPrefixIndexing.permutation[index];
                const [source, sourceIndex] = lookup(v);
                if (destination.position === 'shared') {
                    outShared[destination.index] = [source, sourceIndex];
                }
                else {
                    outPassed[destination.index] = [source, sourceIndex];
                }
            }
            if (rule.premise.type === 'Proposition') {
                indexInsertionRules.push({
                    name: rule.premise.name,
                    args: rule.premise.args,
                    value: rule.premise.value,
                    indexName: rule.inName,
                    shared: inPrefixIndexing.shared,
                    introduced: inPrefixIndexing.introduced,
                });
                binaryRules.push({
                    type: 'IndexLookup',
                    shared: inPrefixIndexing.shared,
                    passed: inPrefixIndexing.passed,
                    introduced: inPrefixIndexing.introduced,
                    inName: rule.inName,
                    outName: rule.outName,
                    outShared,
                    outPassed,
                    indexName: rule.inName,
                });
            }
            else {
                binaryRules.push({
                    shared: inPrefixIndexing.shared,
                    passed: inPrefixIndexing.passed,
                    introduced: inPrefixIndexing.introduced,
                    inName: rule.inName,
                    outName: rule.outName,
                    outShared,
                    outPassed,
                    ...rule.premise,
                });
            }
        }
    }
    const prefixToRule = {};
    const indexToRule = {};
    const prefixToConclusion = {};
    const factToRules = {};
    for (const rule of binaryRules) {
        prefixToRule[rule.inName] = rule;
        if (rule.type === 'IndexLookup') {
            indexToRule[rule.indexName] = rule;
        }
    }
    for (const rule of conclusionRules) {
        prefixToConclusion[rule.inName] = rule;
    }
    for (const rule of indexInsertionRules) {
        factToRules[rule.name] = (factToRules[rule.name] ?? []).concat(rule);
    }
    return {
        seeds: program.seeds,
        demands: new Set(program.demands),
        forbids: new Set(program.forbids),
        indexes,
        indexInsertionRules,
        binaryRules,
        conclusionRules,
        prefixToRule,
        indexToRule,
        prefixToConclusion,
        factToRules,
    };
}
