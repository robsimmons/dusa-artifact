import { AttributeMap } from '../datastructures/attributemap.js';
import PQ from '../datastructures/binqueue.js';
import { dataToString } from '../datastructures/data.js';
import { TrieMap } from '../datastructures/datamap.js';
import { runBuiltinBackward, runBuiltinForward } from './builtin.js';
import { apply, equal, match } from './dataterm.js';
function listyToString(listy) {
    const result = [];
    for (let node = listy; node !== null; node = node.next) {
        result.push(node.data);
    }
    return result;
}
export function makeInitialDb(program) {
    const prefixes = program.seeds.reduce((prefixes, seed) => prefixes.set(seed, [], { data: [], next: null }), AttributeMap.new());
    return {
        factValues: TrieMap.new(),
        prefixes,
        indexes: AttributeMap.new(),
        queue: program.seeds.reduce((q, seed) => q.push(0, { type: 'prefix', name: seed, shared: [], passed: [] }), PQ.new()),
        deferredChoices: AttributeMap.new(),
        remainingDemands: [...program.demands].reduce((demands, demand) => demands.set(demand, [], true), AttributeMap.new()),
    };
}
/* A decision will always take the form "this attribute takes one of these values", or
 * "this attribute takes one of these values, or maybe some other values."
 *
 * Given a database, we can prune any possibilities that are inconsistent with respect to that
 * database, ideally getting a single possibility that we can then use to continue reasoning.
 */
function prune(pred, args, values, exhaustive, db) {
    const knownValue = db.factValues.get(pred, args);
    if (knownValue?.type === 'is') {
        // Each choice is redundant or is immediately contradictory
        // Check for contradiction with the provided options
        if (exhaustive && !values.some((value) => equal(value, knownValue.value))) {
            return { values: [], exhaustive: true };
        }
        // No contradiction, so just continue, nothing was learned
        return { values: [knownValue.value], exhaustive: true };
    }
    if (knownValue?.type === 'is not') {
        values = values.filter((value) => !knownValue.value.some((excludedValue) => equal(excludedValue, value)));
    }
    return { values, exhaustive };
}
/** Imperative: modifies the current database */
export function insertFact(name, args, value, db) {
    const existingFact = db.factValues.get(name, args);
    if (existingFact?.type === 'is not') {
        if (existingFact.value.some((excluded) => equal(excluded, value))) {
            return false;
        }
    }
    else if (existingFact?.type === 'is') {
        if (!equal(existingFact.value, value)) {
            return false;
        }
    }
    db.queue = db.queue.push(0, { type: 'fact', name, args, value });
    db.factValues = db.factValues.set(name, args, { type: 'is', value }).result;
    return true;
}
function stepConclusion(rule, inArgs, db) {
    const substitution = {};
    for (const [index, v] of rule.inVars.entries()) {
        substitution[v] = inArgs[index];
    }
    const args = rule.args.map((arg) => apply(substitution, arg));
    let { values, exhaustive } = prune(rule.name, args, rule.values.map((value) => apply(substitution, value)), rule.exhaustive, db);
    // Merge the conclusion with any existing deferred values
    const [deferredChoice, deferredChoices] = db.deferredChoices.remove(rule.name, args) ?? [
        null,
        db.deferredChoices,
    ];
    if (deferredChoice !== null) {
        if (exhaustive && deferredChoice.exhaustive) {
            // Intersect values
            values = values.filter((v1) => deferredChoice.values.some((v2) => equal(v1, v2)));
        }
        else if (exhaustive) {
            // Ignore deferred values
        }
        else if (deferredChoice.exhaustive) {
            // Ignore values in this conclusion
            values = deferredChoice.values;
        }
        else {
            // Union values
            values = deferredChoice.values.concat(values.filter((v1) => !deferredChoice.values.some((v2) => equal(v1, v2))));
        }
        exhaustive = exhaustive || deferredChoice.exhaustive;
    }
    // Hey kids, what time is it?
    if (exhaustive && values.length === 0) {
        // Time to give up
        return false;
    }
    if (exhaustive && values.length === 1) {
        // Time to assert a fact
        db.deferredChoices = deferredChoices;
        return insertFact(rule.name, args, values[0], db);
    }
    // Time to defer some choices
    db.deferredChoices = deferredChoices.set(rule.name, args, { values, exhaustive });
    return true;
}
function stepFact(rules, args, value, db) {
    for (const rule of rules) {
        let substitution = match({}, rule.value, value);
        for (const [index, pattern] of rule.args.entries()) {
            if (substitution === null)
                break;
            substitution = match(substitution, pattern, args[index]);
        }
        if (substitution !== null) {
            const shared = rule.shared.map((v) => substitution[v]);
            const introduced = rule.introduced.map((v) => substitution[v]);
            const known = db.indexes.get(rule.indexName, shared);
            db.indexes = db.indexes.set(rule.indexName, shared, { data: introduced, next: known });
            db.queue = db.queue.push(0, { type: 'index', name: rule.indexName, shared, introduced });
        }
    }
}
function nextPrefix(rule, shared, passed, introduced) {
    const lookup = ([location, index]) => location === 'shared'
        ? shared[index]
        : location === 'passed'
            ? passed[index]
            : introduced[index];
    return {
        type: 'prefix',
        name: rule.outName,
        shared: rule.outShared.map(lookup),
        passed: rule.outPassed.map(lookup),
    };
}
function extendDbWithPrefixes(candidatePrefixList, db) {
    for (const prefix of candidatePrefixList) {
        if (db.prefixes.get(prefix.name, prefix.shared.concat(prefix.passed)) === null) {
            const known = { data: prefix.passed, next: db.prefixes.get(prefix.name, prefix.shared) };
            db.prefixes = db.prefixes
                .set(prefix.name, prefix.shared.concat(prefix.passed), { data: [], next: null })
                .set(prefix.name, prefix.shared, known);
            db.queue = db.queue.push(0, prefix);
        }
    }
}
function stepPrefix(rule, shared, passed, db) {
    const newPrefixes = [];
    if (rule.type === 'IndexLookup') {
        for (let introduced = db.indexes.get(rule.indexName, shared); introduced !== null; introduced = introduced.next) {
            newPrefixes.push(nextPrefix(rule, shared, passed, introduced.data));
        }
    }
    else {
        const substitution = {};
        for (const [index, v] of rule.shared.entries()) {
            substitution[v] = shared[index];
        }
        if (rule.matchPosition === null) {
            const args = rule.args.map((arg) => apply(substitution, arg));
            const result = runBuiltinForward(rule.name, args);
            if (result !== null) {
                const outputSubst = match(substitution, rule.value, result);
                if (outputSubst !== null) {
                    const introduced = rule.introduced.map((v) => outputSubst[v]);
                    newPrefixes.push(nextPrefix(rule, shared, passed, introduced));
                }
            }
        }
        else {
            const prefixArgs = [];
            const postfixArgs = [];
            let i = 0;
            for (; i < rule.matchPosition; i++) {
                prefixArgs.push(apply(substitution, rule.args[i]));
            }
            const matchedPosition = rule.args[i++];
            for (; i < rule.args.length; i++) {
                postfixArgs.push(apply(substitution, rule.args[i]));
            }
            for (const outputSubst of runBuiltinBackward(rule.name, prefixArgs, matchedPosition, postfixArgs, apply(substitution, rule.value), substitution)) {
                const introduced = rule.introduced.map((v) => outputSubst[v]);
                newPrefixes.push(nextPrefix(rule, shared, passed, introduced));
            }
        }
    }
    extendDbWithPrefixes(newPrefixes, db);
}
function stepIndex(rule, shared, introduced, db) {
    const newPrefixes = [];
    for (let passed = db.prefixes.get(rule.inName, shared); passed !== null; passed = passed.next) {
        newPrefixes.push(nextPrefix(rule, shared, passed.data, introduced));
    }
    extendDbWithPrefixes(newPrefixes, db);
}
/** Functional: does not modify the provided database */
export function stepDb(program, db) {
    const [current, rest] = db.queue.pop();
    db = { ...db, queue: rest };
    if (current.type === 'index') {
        stepIndex(program.indexToRule[current.name], current.shared, current.introduced, db);
        return db;
    }
    if (current.type === 'fact') {
        stepFact(program.factToRules[current.name] || [], current.args, current.value, db);
        return db;
    }
    else if (program.forbids.has(current.name)) {
        return null;
    }
    else if (program.demands.has(current.name)) {
        db.remainingDemands = db.remainingDemands.remove(current.name, [])?.[1] ?? db.remainingDemands;
        return db;
    }
    else if (program.prefixToRule[current.name]) {
        stepPrefix(program.prefixToRule[current.name], current.shared, current.passed, db);
        return db;
    }
    else if (program.prefixToConclusion[current.name]) {
        const conclusionIsConsistent = stepConclusion(program.prefixToConclusion[current.name], current.passed, db);
        return conclusionIsConsistent ? db : null;
    }
    else {
        throw new Error(`Unable to look up rule $${current.name}prefix`);
    }
}
export function listFacts(db) {
    function* iterator() {
        for (const { name, keys, value } of db.factValues.entries()) {
            if (value.type === 'is') {
                yield { name, args: keys, value: value.value };
            }
        }
    }
    return iterator();
}
export function* lookup(db, name, args) {
    const arity = db.factValues.arity(name);
    if (arity !== null && arity < args.length) {
        throw new TypeError(`${name} takes ${arity} argument${arity === 1 ? '' : 's'}, but ${args.length} were given`);
    }
    for (const { keys, value } of db.factValues.lookup(name, args)) {
        if (value.type === 'is') {
            yield { args: keys, value: value.value };
        }
    }
}
export function get(db, name, args) {
    const arity = db.factValues.arity(name);
    if (arity === null)
        return undefined;
    if (args.length !== arity) {
        throw new TypeError(`${name} takes ${arity} argument${arity === 1 ? '' : 's'}, but ${args.length} were given`);
    }
    for (const { value } of db.factValues.lookup(name, args)) {
        if (value.type === 'is')
            return value.value;
    }
    return undefined;
}
function argsetToString(args) {
    return `[ ${args.map((v) => dataToString(v)).join(', ')} ]`;
}
export function queueToString(db) {
    return db.queue
        .toList()
        .map((item) => {
        if (item.type === 'prefix') {
            return `$${item.name}prefix ${argsetToString(item.shared)} ${argsetToString(item.passed)}\n`;
        }
        else if (item.type === 'index') {
            return `$${item.name}index ${argsetToString(item.shared)} ${argsetToString(item.introduced)}\n`;
        }
        else {
            return `${item.name}${item.args.map((v) => ` ${dataToString(v)}`)} is ${dataToString(item.value)}\n`;
        }
    })
        .join('');
}
/** Warning: VERY inefficient */
export function dbToString(db) {
    return `Queue: 
${queueToString(db)}
Facts known:
${[...db.factValues.entries()]
        .map(({ name, keys, value }) => value.type === 'is'
        ? `${name}${keys.map((arg) => ` ${dataToString(arg)}`).join('')} is ${dataToString(value.value)}\n`
        : `${name}${keys.map((arg) => ` ${dataToString(arg)}`).join('')} is none of ${value.value
            .map((v) => dataToString(v))
            .join(', ')}\n`)
        .sort()
        .join('')}
Prefixes known:
${db.prefixes
        .entries()
        .flatMap(([prefix, keys, valuess]) => listyToString(valuess).map((values) => `$${prefix}prefix ${argsetToString(keys)} ${argsetToString(values)}\n`))
        .sort()
        .join('')}`;
}
