'use strict';

let nextRef = -1;
let views = [
    { type: 'triv' },
    { type: 'bool', value: true },
    { type: 'bool', value: false },
];
let strings = {};
let structures = {};
function DANGER_RESET_DATA() {
    nextRef = -1;
    views = [{ type: 'triv' }, { type: 'bool', value: true }, { type: 'bool', value: false }];
    strings = {};
    structures = {};
}
const TRIV_DATA = 0;
const BOOL_TRUE = 1;
const BOOL_FALSE = 2;
function expose(d) {
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
function hide(d) {
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
function escapeString(input) {
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
function dataToString(d, needsParens = true) {
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
function getRef() {
    return nextRef--;
}

function height(t) {
    return t === null ? 0 : t.height;
}
function size(t) {
    return t === null ? 0 : t.size;
}
function lookup$1(t, key) {
    if (t === null)
        return null;
    if (t.key === key)
        return t.value;
    return key < t.key ? lookup$1(t.left, key) : lookup$1(t.right, key);
}
/** Precondition: height(left) and height(right) differ by at most one */
function create(key, value, left, right) {
    return {
        height: Math.max(height(left), height(right)) + 1,
        size: size(left) + size(right) + 1,
        key,
        value,
        left,
        right,
    };
}
/** Precondition: height(left) === 2 + height(right) */
function createAndFixLeft(keyZ, valueZ, x, D) {
    if (height(x.left) >= height(x.right)) {
        /* This is the 'single rotation case,' where a single rotation will fix things.
         * During insertion, the heights will never be equal, and the resulting tree will
         * have height h+2. During deletion, it's possible for the resulting tree to have
         * height h+3.
         *
         *         z              x
         *       /   \           / \
         *      x     D         A   z
         *    /   \  [h]  --->     / \
         *   A     B              B   D
         * [h+1]  [h]
         *       [h+1]
         */
        return create(x.key, x.value, x.left, create(keyZ, valueZ, x.right, D));
    }
    else {
        /* This is the double rotation case. The resulting tree will have height h+2
         *
         *         z                 y
         *       /   \             /   \
         *      x     D           x     z
         *    /   \  [h]  --->   / \   / \
         *   A     y            A   B C   D
         *  [h]  /   \
         *      B     C
         *     [h]   [h]
         *    [h-1] [h-1]
         */
        const y = x.right;
        return create(y.key, y.value, create(x.key, x.value, x.left, y.left), create(keyZ, valueZ, y.right, D));
    }
}
/** Precondition: height(left) + 2 === height(right) */
function createAndFixRight(keyX, valueX, A, z) {
    if (height(z.left) <= height(z.right)) {
        /* This is the 'single rotation case,' where a single rotation will fix things.
         * During insertion, the heights will never be equal, and the resulting tree will
         * have height h+2. During deletion, it's possible for the resulting tree to have
         * height h+3.
         *
         *      x                   z
         *    /   \                / \
         *   A     z              x   C
         *  [h]  /   \    --->   / \
         *      B     C         A   B
         *     [h]  [h+1]
         *    [h+1]
         */
        return create(z.key, z.value, create(keyX, valueX, A, z.left), z.right);
    }
    else {
        /* This is the double rotation case. The resulting tree will have height h+2
         *
         *       x                  y
         *     /   \              /   \
         *    A     z            x     z
         *   [h]  /   \   --->  / \   / \
         *       y     D       A   B C   D
         *     /   \  [h]
         *    B     C
         *   [h]   [h]
         *  [h-1] [h-1]
         */
        const y = z.left;
        return create(y.key, y.value, create(keyX, valueX, A, y.left), create(z.key, z.value, y.right, z.right));
    }
}
function createAndFix(key, value, left, right) {
    switch (height(left) - height(right)) {
        case -2:
            return createAndFixRight(key, value, left, right);
        case 2:
            return createAndFixLeft(key, value, left, right);
        case -1:
        case 0:
        case 1:
            break;
        default:
            throw new Error(`TreeNode: heights differ by ${Math.abs(height(left) - height(right))}`);
    }
    return create(key, value, left, right);
}
function removeMin(t) {
    if (t.left === null) {
        return [t.key, t.value, t.right];
    }
    const [key, value, left] = removeMin(t.left);
    return [key, value, createAndFix(t.key, t.value, left, t.right)];
}
function remove$1(t, key) {
    if (t === null)
        return null;
    if (key < t.key) {
        const result = remove$1(t.left, key);
        return result === null ? null : [result[0], createAndFix(t.key, t.value, result[1], t.right)];
    }
    if (key > t.key) {
        const result = remove$1(t.right, key);
        return result === null ? null : [result[0], createAndFix(t.key, t.value, t.left, result[1])];
    }
    if (t.right === null)
        return [t.value, t.left];
    const [rootKey, rootValue, newRight] = removeMin(t.right);
    return [t.value, createAndFix(rootKey, rootValue, t.left, newRight)];
}
function removeNth(t, n) {
    if (t === null)
        throw new Error('Out of bounds removal');
    if (n < size(t.left)) {
        const [key, value, left] = removeNth(t.left, n);
        return [key, value, createAndFix(t.key, t.value, left, t.right)];
    }
    if (n > size(t.left)) {
        const [key, value, right] = removeNth(t.right, n - size(t.left) - 1);
        return [key, value, createAndFix(t.key, t.value, t.left, right)];
    }
    if (t.right === null)
        return [t.key, t.value, t.left];
    const [rootKey, rootValue, newRight] = removeMin(t.right);
    return [t.key, t.value, createAndFix(rootKey, rootValue, t.left, newRight)];
}
function getNth(t, n) {
    if (t === null)
        throw new Error('Out of bounds lookup');
    if (n < size(t.left))
        return getNth(t.left, n);
    if (n > size(t.left))
        return getNth(t.right, n - size(t.left) - 1);
    return [t.key, t.value];
}
function insert(t, key, value) {
    if (t === null)
        return create(key, value, null, null);
    if (key < t.key) {
        return createAndFix(t.key, t.value, insert(t.left, key, value), t.right);
    }
    else if (key > t.key) {
        return createAndFix(t.key, t.value, t.left, insert(t.right, key, value));
    }
    return create(t.key, value, t.left, t.right);
}
function isTreeNode(t, lo, hi) {
    if (t === null)
        return true;
    return ((lo == null || lo < t.key) &&
        (hi == null || hi > t.key) &&
        t.height === 1 + Math.max(height(t.left), height(t.right)) &&
        t.size === 1 + size(t.left) + size(t.right) &&
        isTreeNode(t.left, lo, t.key) &&
        isTreeNode(t.right, t.key, hi));
}
function accumEntries(accum, t) {
    if (t === null)
        return;
    accumEntries(accum, t.left);
    accum.push([t.key, t.value]);
    accumEntries(accum, t.right);
}
function every(t, test) {
    if (t === null)
        return true;
    return test(t.key, t.value) && every(t.left, test) && every(t.right, test);
}
class DataMap {
    constructor(indexTree, bigintTree) {
        this.indexTree = indexTree;
        this.bigintTree = bigintTree;
    }
    static new() {
        return new DataMap(null, null);
    }
    set(key, value) {
        if (typeof key === 'bigint')
            return new DataMap(this.indexTree, insert(this.bigintTree, key, value));
        return new DataMap(insert(this.indexTree, key, value), this.bigintTree);
    }
    get(key) {
        if (typeof key === 'bigint')
            return lookup$1(this.bigintTree, key);
        return lookup$1(this.indexTree, key);
    }
    getNth(n) {
        if (n < size(this.indexTree))
            return getNth(this.indexTree, n);
        return getNth(this.bigintTree, n - size(this.indexTree));
    }
    remove(key) {
        if (typeof key === 'bigint') {
            const result = remove$1(this.bigintTree, key);
            if (result === null)
                return null;
            return [result[0], new DataMap(this.indexTree, result[1])];
        }
        const result = remove$1(this.indexTree, key);
        if (result === null)
            return null;
        return [result[0], new DataMap(result[1], this.bigintTree)];
    }
    entries() {
        const accum = [];
        accumEntries(accum, this.indexTree);
        accumEntries(accum, this.bigintTree);
        return accum;
    }
    get length() {
        return size(this.indexTree) + size(this.bigintTree);
    }
    every(test) {
        return every(this.indexTree, test) && every(this.bigintTree, test);
    }
    popFirst() {
        if (this.indexTree === null) {
            if (this.bigintTree === null) {
                throw new Error('Removal from empty map');
            }
            const [k, v, bigintTree] = removeMin(this.bigintTree);
            return [k, v, new DataMap(this.indexTree, bigintTree)];
        }
        const [k, v, indexTree] = removeMin(this.indexTree);
        return [k, v, new DataMap(indexTree, this.bigintTree)];
    }
    popRandom() {
        const i = size(this.indexTree);
        const b = size(this.bigintTree);
        const toRemove = Math.floor((i + b) * Math.random());
        if (toRemove < i) {
            const [k, v, indexTree] = removeNth(this.indexTree, toRemove);
            return [k, v, new DataMap(indexTree, this.bigintTree)];
        }
        const [k, v, bigintTree] = removeNth(this.bigintTree, toRemove - i);
        return [k, v, new DataMap(this.indexTree, bigintTree)];
    }
    isOk() {
        return isTreeNode(this.indexTree) && isTreeNode(this.bigintTree);
    }
}
function trieLookup(keys, t) {
    for (const key of keys) {
        if (t === null)
            return null;
        if (t.depth === null)
            throw new Error('triesize');
        t = lookup$1(t.child, key);
    }
    return t;
}
function singleton(index, keys, value) {
    if (index === keys.length) {
        return { depth: null, value };
    }
    else {
        return {
            depth: keys.length - index,
            child: create(keys[index], singleton(index + 1, keys, value), null, null),
        };
    }
}
function trieInsert(index, keys, value, t) {
    if (t === null) {
        return { result: singleton(index, keys, value), removed: null };
    }
    if (index === keys.length) {
        if (t.depth !== null)
            throw new Error('Depth invariant');
        return { result: { depth: null, value }, removed: t.value };
    }
    if (t.depth !== keys.length - index)
        throw new Error('Depth invariant');
    const subTrie = lookup$1(t.child, keys[index]);
    const { result, removed } = trieInsert(index + 1, keys, value, subTrie);
    return { result: { depth: t.depth, child: insert(t.child, keys[index], result) }, removed };
}
function* visitTree(t) {
    const stack = [];
    for (;;) {
        while (t !== null) {
            stack.push(t);
            t = t.left;
        }
        t = stack.pop() ?? null;
        if (t === null)
            return;
        yield { key: t.key, value: t.value };
        t = t.right;
    }
}
function* visitTrieInOrder(tr) {
    const keys = [];
    const stack = [];
    let current = tr;
    while (current !== null) {
        // Descend
        while (current !== null && current.depth !== null) {
            const iterator = visitTree(current.child);
            const result = iterator.next();
            if (result.done)
                throw new Error('Empty trie child');
            const child = result.value;
            keys.push(child.key);
            stack.push(iterator);
            current = child.value;
        }
        // Yield
        yield { keys: [...keys], value: current.value };
        // Ascend
        current = null;
        while (current === null) {
            keys.pop();
            const iterator = stack.pop();
            if (!iterator)
                return;
            const result = iterator.next();
            if (!result.done) {
                keys.push(result.value.key);
                stack.push(iterator);
                current = result.value.value;
            }
        }
    }
}
function* trieMapEntries(t) {
    for (const entry of visitTree(t)) {
        for (const { keys, value } of visitTrieInOrder(entry.value)) {
            yield { name: entry.key, keys, value };
        }
    }
}
class TrieMap {
    constructor(t) {
        this.t = t;
    }
    static new() {
        return new TrieMap(null);
    }
    arity(name) {
        const trie = lookup$1(this.t, name);
        if (trie === null)
            return null;
        return trie.depth ?? 0;
    }
    set(name, args, value) {
        const trie = lookup$1(this.t, name);
        if (trie !== null && args.length !== (trie.depth ?? 0)) {
            throw new Error(`Attribute ${name} has ${trie.depth} arguments, but set was given ${args.length} arguments`);
        }
        const { result, removed } = trieInsert(0, args, value, trie);
        return { result: new TrieMap(insert(this.t, name, result)), removed };
    }
    get(name, args) {
        const trie = lookup$1(this.t, name);
        if (trie !== null && args.length !== (trie.depth ?? 0)) {
            throw new Error(`Attribute ${name} has ${trie.depth} arguments, but get was given ${args.length} arguments`);
        }
        const leaf = trieLookup(args, trie);
        if (leaf === null)
            return null;
        if (leaf.depth !== null) {
            throw new Error(`Invariant`);
        }
        return leaf.value;
    }
    lookup(name, args) {
        const trie = trieLookup(args, lookup$1(this.t, name));
        if (trie === null)
            return [][Symbol.iterator]();
        return visitTrieInOrder(trie);
    }
    entries() {
        return trieMapEntries(this.t);
    }
}

class AttributeMap {
    constructor(map) {
        this.map = map;
    }
    static new() {
        return new AttributeMap(DataMap.new());
    }
    set(name, args, value) {
        return new AttributeMap(this.map.set(hide({ type: 'const', name, args }), value));
    }
    get(name, args) {
        return this.map.get(hide({ type: 'const', name, args }));
    }
    remove(name, args) {
        const result = this.map.remove(hide({ type: 'const', name, args }));
        if (result === null)
            return null;
        return [result[0], new AttributeMap(result[1])];
    }
    entries() {
        const accum = [];
        for (const [data, value] of this.map.entries()) {
            const view = expose(data);
            if (view.type !== 'const')
                throw new Error('Invariant for AttributeMap');
            accum.push([view.name, view.args, value]);
        }
        return accum;
    }
    get length() {
        return this.map.length;
    }
    every(test) {
        return this.map.every((data, value) => {
            const view = expose(data);
            if (view.type !== 'const')
                throw new Error('Invariant for AttributeMap');
            return test(view.name, view.args, value);
        });
    }
    popFirst() {
        const [data, value, map] = this.map.popFirst();
        const view = expose(data);
        if (view.type !== 'const')
            throw new Error('Invariant for AttributeMap');
        return [view.name, view.args, value, new AttributeMap(map)];
    }
    popRandom() {
        const [data, value, map] = this.map.popRandom();
        const view = expose(data);
        if (view.type !== 'const')
            throw new Error('Invariant for AttributeMap');
        return [view.name, view.args, value, new AttributeMap(map)];
    }
}

function join(n1, n2) {
    if (n1.exp !== n2.exp) {
        throw new Error(`Merging heaps of sizes ${n1.exp} and ${n2.exp}`);
    }
    if (n1.prio < n2.prio) {
        const temp = n2;
        n2 = n1;
        n1 = temp;
    }
    // n1 has the higher priority
    return {
        exp: n1.exp + 1,
        elem: n1.elem,
        prio: n1.prio,
        firstChild: {
            exp: n2.exp,
            elem: n2.elem,
            prio: n2.prio,
            nextChild: n1.firstChild,
            firstChild: n2.firstChild,
        },
        nextChild: null,
    };
}
function merge(h1, h2) {
    const len = Math.max(h1.length, h2.length);
    const result = [];
    let carry = null;
    for (let i = 0; i < len; i++) {
        const b1 = h1[i];
        const b2 = h2[i];
        if (!b1 && !b2) {
            result.push(carry); // ?00
            carry = null;
        }
        else if (!carry && !b1) {
            result.push(b2); // 001
            carry = null;
        }
        else if (!carry && !b2) {
            result.push(b1); // 010
            carry = null;
        }
        else if (b1 && b2) {
            result.push(carry); // ?11
            carry = join(b1, b2);
        }
        else if (carry && b1) {
            result.push(null); // 110
            carry = join(carry, b1);
        }
        else if (carry && b2) {
            result.push(null); // 101
            carry = join(carry, b2);
        }
    }
    if (carry) {
        result.push(carry);
    }
    return result;
}
function remove(heaps) {
    let best = null;
    for (let i = 0; i < heaps.length; i++) {
        if (heaps[i] !== null) {
            if (best === null || heaps[i].prio > best.prio) {
                best = { prio: heaps[i].prio, index: i };
            }
        }
    }
    if (best === null)
        throw new Error('Removing from an empty priority queue');
    const removed = heaps[best.index];
    const result = removed.elem;
    const heaps1 = heaps.map((h, i) => (i === best.index ? null : h));
    while (heaps1.length > 0 && heaps1[heaps1.length - 1] === null) {
        heaps1.pop();
    }
    const heaps2 = new Array(removed.exp);
    for (let removedChild = removed.firstChild; removedChild !== null; removedChild = removedChild.nextChild) {
        heaps2[removedChild.exp] = removedChild;
    }
    return [result, merge(heaps1, heaps2)];
}
function debugToString(heaps) {
    return heaps.map((heap, i) => (heap === null ? '*' : debugHeapToString(heap, i)));
}
function debugHeapToString(heap, exp) {
    if (exp !== heap.exp) {
        throw new Error(`Expected heap exponent ${exp}, got heap exponent ${heap.exp}`);
    }
    if (heap.firstChild === null) {
        if (exp !== 0) {
            throw new Error(`No child for heap with exponent ${exp}`);
        }
        return `${heap.elem}`;
    }
    if (exp === 0) {
        throw new Error(`Expected heap exponent ${exp}, got heap exponent ${heap.exp}`);
    }
    const neighbors = [];
    for (let child = heap.firstChild; child !== null; child = child.nextChild) {
        exp -= 1;
        neighbors.push(debugHeapToString(child, exp));
    }
    if (exp !== 0)
        throw new Error(`${exp} too few children`);
    return `${heap.elem}[${neighbors.join(',')}]`;
}
class PQ {
    constructor(size, heaps) {
        this.size = size;
        this.heaps = heaps;
    }
    static new() {
        return new PQ(0, []);
    }
    get length() {
        return this.size;
    }
    push(prio, elem) {
        return new PQ(this.size + 1, merge(this.heaps, [{ exp: 0, elem, prio, firstChild: null, nextChild: null }]));
    }
    pop() {
        const [result, heaps] = remove(this.heaps);
        return [result, new PQ(this.size - 1, heaps)];
    }
    debugToString() {
        return debugToString(this.heaps).join(',');
    }
    toList() {
        const result = [];
        let heaps = this.heaps;
        let elem;
        for (let i = 0; i < this.size; i++) {
            [elem, heaps] = remove(heaps);
            result.push(elem);
        }
        return result;
    }
}

function match(substitution, pattern, data) {
    const dv = expose(data);
    switch (pattern.type) {
        case 'triv':
            if (pattern.type !== dv.type)
                return null;
            return substitution;
        case 'int':
            if (dv.type !== 'int')
                return null;
            if (BigInt(pattern.value) !== dv.value)
                return null;
            return substitution;
        case 'string':
        case 'bool':
            if (pattern.type !== dv.type)
                return null;
            if (pattern.value !== dv.value)
                return null;
            return substitution;
        case 'const':
            if (dv.type !== 'const' || pattern.name !== dv.name || pattern.args.length !== dv.args.length)
                return null;
            for (let i = 0; i < pattern.args.length; i++) {
                const candidate = match(substitution, pattern.args[i], dv.args[i]);
                if (candidate === null)
                    return null;
                substitution = candidate;
            }
            return substitution;
        case 'wildcard':
            return substitution;
        case 'var':
            if (substitution[pattern.name] !== undefined) {
                return equal(substitution[pattern.name], data) ? substitution : null;
            }
            return { [pattern.name]: data, ...substitution };
    }
}
function apply(substitution, pattern) {
    switch (pattern.type) {
        case 'triv':
        case 'bool':
        case 'string': {
            return hide(pattern);
        }
        case 'int':
            return hide({ type: 'int', value: BigInt(pattern.value) });
        case 'const': {
            return hide({
                type: 'const',
                name: pattern.name,
                args: pattern.args.map((arg) => apply(substitution, arg)),
            });
        }
        case 'wildcard': {
            throw new Error(`Cannot match apply a substitution to a pattern containing the wildcard '_'`);
        }
        case 'var': {
            const result = substitution[pattern.name];
            if (result == null) {
                throw new Error(`Free variable '${pattern.name}' not assigned to in grounding substitution`);
            }
            return result;
        }
    }
}
function equal(t, s) {
    return t === s;
}

function* runBuiltinBackward(pred, prefix, matchPosition, postfix, value, substitution) {
    const v = expose(value);
    switch (pred) {
        case 'BOOLEAN_FALSE':
        case 'BOOLEAN_TRUE':
        case 'NAT_ZERO':
        case 'INT_TIMES':
            throw new TypeError(`${pred} should not be run backwards`);
        case 'NAT_SUCC': {
            if (v.type !== 'int')
                return;
            if (v.value <= 0n)
                return;
            const subst = match(substitution, matchPosition, hide({ type: 'int', value: v.value - 1n }));
            if (subst !== null) {
                yield subst;
            }
            return;
        }
        case 'INT_MINUS': {
            if (v.type !== 'int')
                return;
            let expected;
            if (prefix.length === 1 && postfix.length === 0) {
                const a = expose(prefix[0]);
                if (a.type !== 'int')
                    return;
                expected = a.value - v.value;
            }
            else if (prefix.length === 0 && postfix.length === 1) {
                const b = expose(prefix[0]);
                if (b.type !== 'int')
                    return;
                expected = v.value + b.value;
            }
            else {
                throw new TypeError(`INT_MINUS expects 2 arguments, given ${prefix.length + postfix.length + 1}`);
            }
            const subst = match(substitution, matchPosition, hide({ type: 'int', value: expected }));
            if (subst !== null) {
                yield subst;
            }
            return;
        }
        case 'INT_PLUS': {
            if (v.type !== 'int')
                return;
            let expected = v.value;
            for (const arg of prefix.concat(postfix)) {
                const view = expose(arg);
                if (view.type !== 'int')
                    return;
                expected = expected - view.value;
            }
            const subst = match(substitution, matchPosition, hide({ type: 'int', value: expected }));
            if (subst !== null) {
                yield subst;
            }
            return;
        }
        case 'STRING_CONCAT': {
            const preStr = [];
            for (const arg of prefix) {
                const view = expose(arg);
                if (view.type !== 'string')
                    return;
                preStr.push(view.value);
            }
            const postStr = [];
            for (const arg of postfix) {
                const view = expose(arg);
                if (view.type !== 'string')
                    return;
                postStr.push(view.value);
            }
            if (v.type !== 'string')
                return;
            const pre = preStr.join('');
            const post = postStr.join('');
            if (!v.value.startsWith(pre))
                return;
            let result = v.value.slice(pre.length);
            if (!result.endsWith(post))
                return;
            result = result.slice(0, result.length - post.length);
            const subst = match(substitution, matchPosition, hide({ type: 'string', value: result }));
            if (subst === null)
                return;
            yield subst;
            return;
        }
        case 'EQUAL': {
            if (v.type !== 'bool')
                return;
            let actualValue = null;
            for (const arg of prefix.concat(postfix)) {
                if (actualValue === null) {
                    actualValue = arg;
                }
                else {
                    if (!equal(actualValue, arg)) {
                        if (!v.value) {
                            yield substitution;
                        }
                        return;
                    }
                }
            }
            if (actualValue === null) {
                yield substitution;
                return;
            }
            const subst = match(substitution, matchPosition, actualValue);
            if (!v.value && subst === null) {
                // If we are checking whether equality outputs #ff, then we require no match
                yield substitution;
                return;
            }
            else if (v.value && subst !== null) {
                // If we are checking whether equality outputs #tt, then we require a match
                yield subst;
                return;
            }
            return;
        }
    }
}
function runBuiltinForward(pred, args) {
    switch (pred) {
        case 'BOOLEAN_FALSE':
            return BOOL_FALSE;
        case 'BOOLEAN_TRUE':
            return BOOL_TRUE;
        case 'NAT_ZERO':
            return hide({ type: 'int', value: 0n });
        case 'EQUAL':
            for (let i = 1; i < args.length; i++) {
                if (!equal(args[i - 1], args[i]))
                    return BOOL_FALSE;
            }
            return BOOL_TRUE;
        case 'GEQ':
        case 'GT': {
            const [a, b] = args.map(expose);
            if (a.type !== 'int' || b.type !== 'int')
                return null;
            if (a.value > b.value)
                return BOOL_TRUE;
            if (a.value < b.value)
                return BOOL_FALSE;
            return pred === 'GEQ' ? BOOL_TRUE : BOOL_FALSE;
        }
        case 'STRING_CONCAT': {
            const strings = [];
            for (const arg of args) {
                const view = expose(arg);
                if (view.type !== 'string')
                    return null;
                strings.push(view.value);
            }
            return hide({ type: 'string', value: strings.join('') });
        }
        case 'INT_MINUS': {
            if (args.length !== 2) {
                throw new TypeError(`INT_MINUS expects 2 arguments, given ${args.length}`);
            }
            const [a, b] = args.map(expose);
            if (a.type !== 'int' || b.type !== 'int')
                return null;
            return hide({ type: 'int', value: a.value - b.value });
        }
        case 'INT_PLUS': {
            let sum = 0n;
            for (const arg of args) {
                const view = expose(arg);
                if (view.type !== 'int')
                    return null;
                sum += view.value;
            }
            return hide({ type: 'int', value: sum });
        }
        case 'INT_TIMES': {
            let product = 1n;
            for (const arg of args) {
                const view = expose(arg);
                if (view.type !== 'int')
                    return null;
                product *= view.value;
            }
            return hide({ type: 'int', value: product });
        }
        case 'NAT_SUCC': {
            const n = expose(args[0]);
            if (n.type !== 'int')
                return null;
            if (n.value < 0)
                return null;
            return hide({ type: 'int', value: n.value + 1n });
        }
    }
}

function listyToString(listy) {
    const result = [];
    for (let node = listy; node !== null; node = node.next) {
        result.push(node.data);
    }
    return result;
}
function makeInitialDb(program) {
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
function prune$1(pred, args, values, exhaustive, db) {
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
function insertFact(name, args, value, db) {
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
    let { values, exhaustive } = prune$1(rule.name, args, rule.values.map((value) => apply(substitution, value)), rule.exhaustive, db);
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
        else if (exhaustive) ;
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
function stepDb(program, db) {
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
function listFacts(db) {
    function* iterator() {
        for (const { name, keys, value } of db.factValues.entries()) {
            if (value.type === 'is') {
                yield { name, args: keys, value: value.value };
            }
        }
    }
    return iterator();
}
function* lookup(db, name, args) {
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
function get(db, name, args) {
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
function queueToString(db) {
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
function dbToString(db) {
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

function maybeStep(program, ref) {
    if (ref.db.queue.length === 0) {
        if (ref.db.deferredChoices.length === 0) {
            // Saturation! Check that it meets requirements
            // TODO this "every" is quite inefficient. As an alternative, we could
            // add facts that need to be positively asserted to remainingDemands or
            // something equivalent, and just check that the remaining un-asserted
            // fact set is null
            if ([...ref.db.factValues.entries()].every(({ value }) => value.type === 'is') &&
                ref.db.remainingDemands.length === 0) {
                return 'solution';
            }
            else {
                return 'discard';
            }
        }
        else {
            // Must make a choice
            return 'choose';
        }
    }
    else {
        const db = stepDb(program, ref.db);
        if (db === null) {
            return 'discard';
        }
        else {
            ref.db = db;
            return 'stepped';
        }
    }
}
function cleanPath(path) {
    while (path.length > 0) {
        const [parentNode, parentChoice] = path.pop();
        if (parentChoice === 'defer') {
            parentNode.defer = 'exhaustive';
        }
        else {
            parentNode.children = parentNode.children.remove(parentChoice)[1];
        }
        if (parentNode.defer !== 'exhaustive' || parentNode.children.length > 0) {
            return { tree: parentNode, path };
        }
    }
    return { tree: null };
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
function stepTreeRandomDFS(program, tree, path, stats) {
    switch (tree.type) {
        case 'leaf': {
            const stepResult = maybeStep(program, tree);
            switch (stepResult) {
                case 'stepped': {
                    stats.cycles += 1;
                    return { tree, path };
                }
                case 'solution': {
                    // Return to the root
                    const cleaned = cleanPath(path);
                    if (cleaned.tree === null)
                        return { tree: null, solution: tree.db };
                    if (cleaned.path.length === 0)
                        return { tree: cleaned.tree, path: [], solution: tree.db };
                    return { tree: cleaned.path[0][0], path: [], solution: tree.db };
                }
                case 'choose': {
                    // Forced to make a choice
                    // TODO prune everything: if a choice has become unitary we shouldn't branch
                    if (tree.db.deferredChoices.length === 0) {
                        // This case may be impossible?
                        console.error('====== unexpected point reached ======');
                        return cleanPath(path);
                    }
                    const [pred, args, unpruned, deferredChoices] = tree.db.deferredChoices.popRandom();
                    const { values, exhaustive } = prune(pred, args, unpruned.values, unpruned.exhaustive, tree.db);
                    const newTree = {
                        type: 'choice',
                        base: { ...tree.db, deferredChoices },
                        attribute: [pred, args],
                        children: DataMap.new(),
                        defer: 'exhaustive', // A default, we may change this below
                    };
                    // Add a child for each positive choice of value
                    for (const choice of values) {
                        newTree.children = newTree.children.set(choice, null);
                    }
                    // If the tree is open-ended, add a child for all negative choices of value
                    if (!exhaustive) {
                        const currentAssignment = tree.db.factValues.get(pred, args) ?? {
                            type: 'is not',
                            value: [],
                        };
                        if (currentAssignment.type === 'is') {
                            throw new Error('Invariant: prunedChoice should have returned exhaustive === true');
                        }
                        newTree.defer = {
                            type: 'leaf',
                            db: {
                                ...tree.db,
                                deferredChoices,
                                factValues: tree.db.factValues.set(pred, args, {
                                    type: 'is not',
                                    value: currentAssignment.value.concat(values.filter((v1) => !currentAssignment.value.some((v2) => equal(v1, v2)))),
                                }).result,
                            },
                        };
                    }
                    // Fix up the parent pointer
                    if (path.length > 0) {
                        const [parent, route] = path[path.length - 1];
                        if (route === 'defer') {
                            parent.defer = newTree;
                        }
                        else {
                            parent.children = parent.children.set(route, newTree);
                        }
                    }
                    return { tree: newTree, path };
                }
                case 'discard': {
                    // Return only as far as possible
                    stats.deadEnds += 1;
                    const result = cleanPath(path);
                    if (result.tree === null || result.path.length === 0)
                        return result;
                    if (Math.random() > 0.01)
                        return result;
                    return { tree: result.path[0][0], path: [] };
                }
                default:
                    throw new Error('should be unreachable');
            }
        }
        case 'choice': {
            if (tree.children.length === 0) {
                if (tree.defer === 'exhaustive') {
                    return cleanPath(path);
                }
                path.push([tree, 'defer']);
                return { tree: tree.defer, path };
            }
            else {
                const [value, existingChild] = tree.children.getNth(Math.floor(Math.random() * tree.children.length));
                if (existingChild !== null) {
                    path.push([tree, value]);
                    return { tree: existingChild, path };
                }
                const newDb = { ...tree.base };
                if (!insertFact(tree.attribute[0], tree.attribute[1], value, newDb)) {
                    tree.children = tree.children.remove(value)[1];
                    return { tree, path };
                }
                const newChild = { type: 'leaf', db: newDb };
                tree.children = tree.children.set(value, newChild);
                path.push([tree, value]);
                return { tree: newChild, path };
            }
        }
    }
}
function pathToString(tree, path) {
    return `~~~~~~~~~~~~~~
${path.map(([node, data]) => choiceTreeNodeToString(node, data)).join('\n\n')}
${tree.type === 'leaf' ? dbToString(tree.db) : choiceTreeNodeToString(tree)}`;
}
function choiceTreeNodeToString({ attribute, children, defer }, data) {
    return `Tree node for attribute ${dataToString(hide({ type: 'const', name: attribute[0], args: attribute[1] }))}${children
        .entries()
        .map(([dataOption, child]) => `${data !== undefined && data !== 'defer' && equal(data, dataOption) ? '\n * ' : '\n   '}${dataToString(dataOption)}:${child === null ? ' null' : ' ...'}`)
        .join('')}${defer === 'exhaustive' ? '' : `\n${data === 'defer' ? ' * ' : '   '}<defer>: ...`}`;
}

function termToString(t, needsParens = true) {
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
function theseVarsGroundThisPattern(vars, t) {
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
function repeatedWildcards(knownWildcards, ...patterns) {
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
function freeVars(...patterns) {
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
function freeParsedVars(...patterns) {
    const s = new Map();
    for (const pattern of patterns) {
        freeParsedVarsAccum(s, pattern);
    }
    return s;
}

function headToString(head) {
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
function freeVarsPremise(premise) {
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
function* visitPropsInProgram(decls) {
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
function* visitSubterms(...terms) {
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
function* visitTermsInPremises(...premises) {
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

function checkPropositionArity(decls) {
    const arities = new Map();
    for (const prop of visitPropsInProgram(decls)) {
        if (!arities.get(prop.name))
            arities.set(prop.name, new Map());
        if (!arities.get(prop.name).get(prop.args.length)) {
            arities.get(prop.name).set(prop.args.length, [prop.loc]);
        }
        else {
            arities.get(prop.name).get(prop.args.length).push(prop.loc);
        }
    }
    const actualArities = {};
    const issues = [];
    for (const [pred, map] of arities.entries()) {
        const arityList = [...map.entries()].sort((a, b) => b[1].length - a[1].length);
        const expectedArity = arityList[0][0];
        actualArities[pred] = expectedArity;
        for (let i = 1; i < arityList.length; i++) {
            const [arity, occurrences] = arityList[i];
            for (const occurrence of occurrences) {
                issues.push({
                    type: 'Issue',
                    msg: `Predicate '${pred}' usually has ${expectedArity} argument${expectedArity === 1 ? '' : 's'}, but here it has ${arity}`,
                    loc: occurrence,
                    severity: 'error',
                });
            }
        }
    }
    if (issues.length > 0)
        return { issues };
    return { issues: null, arities: actualArities };
}
/**
 * Gathers uses of free variables in premises and checks that
 * free variables are being used correctly and that named wildcards
 * (like _X) aren't being reused.
 *
 * Will rearrange inequality and equality premises so that the fully-groundable
 * term always comes first.
 */
function checkFreeVarsInPremises(premises) {
    const knownFreeVars = new Map();
    const knownWildcards = new Set();
    const knownForbiddenVars = new Set();
    const errors = [];
    function checkNotForbidden(fv) {
        for (const [v, loc] of fv.entries()) {
            if (knownForbiddenVars.has(v)) {
                errors.push({
                    type: 'Issue',
                    msg: `Variable ${v} cannot be reused in a later premise because its first occurance was in an inequality`,
                    loc,
                    severity: 'error',
                });
            }
        }
    }
    function checkForDuplicateWildcards(...patterns) {
        for (const [dup, loc] of repeatedWildcards(knownWildcards, ...patterns)) {
            errors.push({
                type: 'Issue',
                msg: `Named wildcard ${dup} used multiple times in a rule.`,
                loc,
                severity: 'error',
            });
        }
    }
    for (const premise of premises) {
        switch (premise.type) {
            case 'Inequality':
            case 'Equality': {
                checkForDuplicateWildcards(premise.a, premise.b);
                const [newA, newB] = [premise.a, premise.b].map((tm) => {
                    const wildcards = new Set();
                    repeatedWildcards(wildcards, tm);
                    const fv = freeParsedVars(tm);
                    checkNotForbidden(fv);
                    let newVar = null;
                    for (const [v, loc] of fv) {
                        if (!knownFreeVars.has(v)) {
                            newVar = v;
                            if (premise.type === 'Inequality') {
                                knownForbiddenVars.add(v);
                            }
                            else {
                                knownFreeVars.set(v, loc);
                            }
                        }
                    }
                    for (const wc of wildcards) {
                        newVar = wc;
                    }
                    return newVar;
                });
                if (newA && newB) {
                    errors.push({
                        type: 'Issue',
                        msg: `Only one side of an ${premise.type.toLowerCase()} can include a first occurance of a variable or a wildcard. The left side uses ${newA}, the right side uses ${newB}.`,
                        loc: premise.loc,
                        severity: 'error',
                    });
                }
                break;
            }
            case 'Proposition': {
                const propArgs = premise.value === null ? premise.args : [...premise.args, premise.value];
                checkForDuplicateWildcards(...propArgs);
                const fv = freeParsedVars(...propArgs);
                checkNotForbidden(fv);
                for (const [v, loc] of fv) {
                    knownFreeVars.set(v, loc);
                }
                break;
            }
        }
    }
    if (errors.length === 0) {
        return {
            fv: new Set(knownFreeVars.keys()),
            errors: null,
            forbidden: knownForbiddenVars,
        };
    }
    return { errors };
}
function checkFreeVarsInDecl(decl) {
    const premiseCheck = checkFreeVarsInPremises(decl.premises);
    if (premiseCheck.errors !== null) {
        return premiseCheck.errors;
    }
    const { fv, forbidden } = premiseCheck;
    switch (decl.type) {
        case 'Demand':
        case 'Forbid':
            return [];
        case 'Rule': {
            const errors = [];
            const headArgs = decl.conclusion.values === null
                ? decl.conclusion.args
                : [...decl.conclusion.args, ...decl.conclusion.values];
            const headVars = freeParsedVars(...headArgs);
            const wildcards = new Set();
            repeatedWildcards(wildcards, ...headArgs);
            for (const w of wildcards) {
                errors.push({
                    type: 'Issue',
                    msg: `Cannot include wildcard ${w} in the head of a rule.`,
                    loc: decl.conclusion.loc,
                    severity: 'error',
                });
            }
            for (const [v, loc] of headVars) {
                if (forbidden.has(v)) {
                    errors.push({
                        type: 'Issue',
                        msg: `Variable '${v}' used in head of rule but was first defined in an inequality.`,
                        loc,
                        severity: 'error',
                    });
                }
                else if (!fv.has(v)) {
                    errors.push({
                        type: 'Issue',
                        msg: `Variable '${v}' used in head of rule but not defined in a premise.`,
                        loc,
                        severity: 'error',
                    });
                }
            }
            return errors;
        }
    }
}
function checkFunctionalPredicatesInTerm(preds, boundVars, pattern) {
    if (pattern.type === 'const') {
        const expectedNum = preds.get(pattern.name);
        if (expectedNum !== undefined && expectedNum !== pattern.args.length) {
            return [
                {
                    type: 'Issue',
                    loc: pattern.loc,
                    msg: `The functional predicate '${pattern.name}' should be given ${expectedNum} argument${expectedNum === 1 ? '' : 's'}, but is given ${pattern.args.length} here`,
                    severity: 'error',
                },
            ];
        }
    }
    else if (pattern.type === 'special') {
        switch (pattern.name) {
            case 'BOOLEAN_FALSE':
            case 'BOOLEAN_TRUE':
            case 'NAT_ZERO':
                if (pattern.args.length !== 0) {
                    return [
                        {
                            type: 'Issue',
                            loc: pattern.loc,
                            msg: `Built-in ${pattern.name} (${pattern.symbol}) expects no argument, has ${pattern.args.length}`,
                            severity: 'error',
                        },
                    ];
                }
                break;
            case 'INT_MINUS':
                if (pattern.args.length !== 2) {
                    return [
                        {
                            type: 'Issue',
                            loc: pattern.loc,
                            msg: `Built-in ${pattern.name} (${pattern.symbol}) expects two arguments, has ${pattern.args.length}`,
                            severity: 'error',
                        },
                    ];
                }
                if (!theseVarsGroundThisPattern(boundVars, pattern.args[0]) ||
                    !theseVarsGroundThisPattern(boundVars, pattern.args[1])) {
                    return [
                        {
                            type: 'Issue',
                            loc: pattern.loc,
                            msg: `Built-in ${pattern.name} (${pattern.symbol}) needs to have one of its arguments grounded by previous premises, and that is not the case here.`,
                            severity: 'error',
                        },
                    ];
                }
                break;
            case 'GT':
            case 'GEQ':
            case 'INT_TIMES': {
                for (const arg of pattern.args) {
                    if (!theseVarsGroundThisPattern(boundVars, arg)) {
                        return [
                            {
                                type: 'Issue',
                                loc: pattern.loc,
                                msg: `Built-in ${pattern.name} (${pattern.symbol}) needs to have all of its arguments grounded by previous premises, but the argument '${termToString(arg)}' is not ground`,
                                severity: 'error',
                            },
                        ];
                    }
                }
                break;
            }
            case 'EQUAL':
            case 'INT_PLUS':
            case 'NAT_SUCC':
            case 'STRING_CONCAT': {
                let nonGround = null;
                for (const arg of pattern.args) {
                    if (!theseVarsGroundThisPattern(boundVars, arg)) {
                        if (nonGround === null) {
                            nonGround = arg;
                        }
                        else {
                            return [
                                {
                                    type: 'Issue',
                                    loc: pattern.loc,
                                    msg: `Built-in ${pattern.name} (${pattern.symbol}) needs to have all but one of its arguments grounded by previous premises, but the arguments '${termToString(nonGround)}' and '${termToString(arg)}' are both not ground.`,
                                    severity: 'error',
                                },
                            ];
                        }
                    }
                }
                break;
            }
        }
    }
    return [];
}
/**
 * This check assumes that the first free variable checks have passed, and serves
 * only to check that the flattening transformation will produce a well-moded program when
 * functional predicates get flattened out into separate premises, and where functional
 * predicates in new premises have a appropriate number of arguments.
 */
function checkFunctionalPredicatesInDecl(preds, decl) {
    const boundVars = new Set();
    const issues = [];
    for (const premise of decl.premises) {
        for (const pattern of visitTermsInPremises(premise)) {
            issues.push(...checkFunctionalPredicatesInTerm(preds, boundVars, pattern));
        }
        for (const fv of freeVarsPremise(premise)) {
            boundVars.add(fv);
        }
    }
    if (decl.type === 'Rule') {
        for (const pattern of visitSubterms(...decl.conclusion.args, ...(decl.conclusion.values ?? []))) {
            issues.push(...checkFunctionalPredicatesInTerm(preds, boundVars, pattern));
        }
    }
    return issues;
}
function check(decls) {
    const arityInfo = checkPropositionArity(decls);
    const errors = arityInfo.issues || [];
    for (const decl of decls) {
        const declErrors = checkFreeVarsInDecl(decl);
        if (declErrors.length === 0 && arityInfo.issues === null) {
            const preds = new Map(Object.entries(arityInfo.arities));
            declErrors.push(...checkFunctionalPredicatesInDecl(preds, decl));
        }
        errors.push(...declErrors);
    }
    return { errors, arities: new Map(Object.entries(arityInfo)) };
}

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
function indexToRuleName(index) {
    if (index >= 26) {
        return `${indexToRuleName(Math.floor(index / 26))}${String.fromCharCode(97 + (index % 26))}`;
    }
    return String.fromCharCode(97 + index);
}
function flattenAndName(decls) {
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
function flatPremiseToString(premise) {
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
function flatDeclToString([name, decl]) {
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
function flatProgramToString(flatProgram) {
    return flatProgram.map(flatDeclToString).join('\n');
}

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
function freeVarsBinarizedPremise(premise) {
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
function binarizedProgramToString(program) {
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
function binarize(decls) {
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
function indexedProgramToString(program) {
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
function indexize(program) {
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

/** Compiles a *checked* program */
function compile(decls, debug = false) {
    const flattened = flattenAndName(decls);
    if (debug) {
        console.log(`Form 1: flattened program
${flatProgramToString(flattened)}`);
    }
    const binarized = binarize(flattened);
    if (debug) {
        console.log(`\nForm 2: Binarized program
${binarizedProgramToString(binarized)}`);
    }
    const indexed = indexize(binarized);
    if (debug) {
        console.log(`\nForm 3: Index-aware program
${indexedProgramToString(indexed)}`);
    }
    return indexed;
}

const BUILT_IN_MAP = {
    BOOLEAN_TRUE: null,
    BOOLEAN_FALSE: null,
    NAT_ZERO: null,
    NAT_SUCC: null,
    INT_PLUS: null,
    INT_MINUS: null,
    INT_TIMES: null,
    STRING_CONCAT: null,
    EQUAL: null,
    GT: null,
    GEQ: null,
};

const punct = [
    '...',
    ',',
    '.',
    '{',
    '}',
    '(',
    ')',
    ':-',
    '->',
    '!=',
    '==',
    '?',
    '>=',
    '>',
    '<=',
    '<',
];
const META_ID_TOKEN = /^[A-Za-z_][A-Za-z0-9_]*/;
const META_NUM_TOKEN = /^[+-]?[0-9][A-Za-z0-9_]*/;
const CONST_TOKEN = /^[a-z][a-zA-Z0-9_]*$/;
const WILDCARD_TOKEN = /^_[a-zA-Z0-9_]*$/;
const VAR_TOKEN = /^[A-Z][a-zA-Z0-9_]*$/;
const INT_TOKEN = /^-?(0|[1-9][0-9]*)$/;
const TRIV_TOKEN = /^\(\)/;
function issue(stream, msg) {
    return {
        type: 'Issue',
        msg,
        severity: 'error',
        loc: stream.matchedLocation(),
    };
}
const dusaTokenizer = {
    startState: { type: 'Beginning', defaults: BUILT_IN_MAP },
    advance: (stream, state) => {
        let tok;
        if (stream.eol()) {
            if (state.type === 'InString') {
                console.log();
                return {
                    state: { type: 'Normal', defaults: state.defaults },
                    tag: 'invalid',
                    issues: [
                        {
                            type: 'Issue',
                            msg: 'End of string not found at end of line',
                            severity: 'error',
                            loc: { start: state.start, end: state.end },
                        },
                    ],
                };
            }
            return { state };
        }
        if (state.type !== 'InString') {
            if (stream.eat(/^\s+/)) {
                return { state };
            }
            if (stream.eat(/^#(| .*)$/)) {
                return { state, tag: 'comment' };
            }
        }
        switch (state.type) {
            case 'Beginning':
                if ((tok = stream.eat('#'))) {
                    tok = stream.eat(META_ID_TOKEN) ?? stream.eat(META_NUM_TOKEN);
                    if (!tok) {
                        stream.eat(/^.*$/);
                        return {
                            state: state,
                            issues: [
                                issue(stream, `Expect # to be followed by a constant (directive) or space (comment)`),
                            ],
                            tag: 'invalid',
                        };
                    }
                    if (tok === 'builtin') {
                        return {
                            state: { ...state, type: 'Builtin1', hashloc: stream.matchedLocation() },
                            tag: 'meta',
                        };
                    }
                    return {
                        state: { ...state, type: 'Normal' },
                        tag: 'meta',
                        tree: { type: 'hashdirective', value: tok, loc: stream.matchedLocation() },
                    };
                }
                return { state: { ...state, type: 'Normal' } };
            case 'Builtin1':
                tok = stream.eat(META_ID_TOKEN) ?? stream.eat(META_NUM_TOKEN);
                if (!Object.keys(BUILT_IN_MAP).some((name) => name === tok)) {
                    return {
                        state: { type: 'Normal', defaults: state.defaults },
                        issues: [
                            {
                                type: 'Issue',
                                msg: `Expected token following #builtin to be one of ${Object.keys(BUILT_IN_MAP).join(', ')}`,
                                severity: 'error',
                                loc: { start: state.hashloc.start, end: stream.matchedLocation().end },
                            },
                        ],
                        tag: 'invalid',
                    };
                }
                return {
                    state: { ...state, type: 'Builtin2', builtin: tok },
                    tag: 'meta',
                };
            case 'Builtin2':
                tok = stream.eat(META_ID_TOKEN) ?? stream.eat(META_NUM_TOKEN);
                if (tok === null || !tok.match(CONST_TOKEN)) {
                    return {
                        state: { type: 'Normal', defaults: state.defaults },
                        issues: [
                            {
                                type: 'Issue',
                                msg: `Expected constant following #builtin ${state.builtin}`,
                                severity: 'error',
                                loc: { start: state.hashloc.start, end: stream.matchedLocation().end },
                            },
                        ],
                        tag: 'invalid',
                    };
                }
                return {
                    state: { type: 'Builtin3', defaults: { ...state.defaults, [state.builtin]: tok } },
                    tag: 'macroName',
                };
            case 'Builtin3':
                return {
                    state: { ...state, type: 'Beginning' },
                    tag: stream.eat('.') ? 'punctuation' : undefined,
                };
            case 'InString':
                if ((tok = stream.eat('"'))) {
                    return {
                        state: { type: 'Normal', defaults: state.defaults },
                        tag: 'string',
                        tree: {
                            type: 'string',
                            value: state.collected,
                            loc: { start: state.start, end: stream.matchedLocation().end },
                        },
                    };
                }
                if ((tok = stream.eat(/^[^"\n\r\\]+/))) {
                    return {
                        state: {
                            ...state,
                            collected: state.collected + tok,
                            end: stream.matchedLocation().end,
                        },
                        tag: 'string',
                    };
                }
                if (stream.eat('\\')) {
                    if ((tok = stream.eat(/^([0bfnrtv'"\\]|x[0-9a-fA-F][0-9a-fA-F]|u\{[0-9a-fA-F]{1,6}\})/))) {
                        switch (tok[0]) {
                            case '0':
                                tok = '\0';
                                break;
                            case 'b':
                                tok = '\b';
                                break;
                            case 'f':
                                tok = '\f';
                                break;
                            case 'n':
                                tok = '\n';
                                break;
                            case 'r':
                                tok = '\r';
                                break;
                            case 't':
                                tok = '\t';
                                break;
                            case 'v':
                                tok = '\v';
                                break;
                            case "'":
                                tok = "'";
                                break;
                            case '"':
                                tok = '"';
                                break;
                            case '\\':
                                tok = '\\';
                                break;
                            case 'x':
                                tok = String.fromCharCode(parseInt(tok.slice(1), 16));
                                break;
                            default: {
                                // case 'u'
                                const charCode = parseInt(tok.slice(2, tok.length - 1), 16);
                                if (0xd800 <= charCode && charCode < 0xe000) {
                                    return {
                                        state,
                                        issues: [
                                            {
                                                type: 'Issue',
                                                msg: `Cannot encode lone surrogate ${tok}`,
                                                severity: 'error',
                                                loc: stream.matchedLocation(),
                                            },
                                        ],
                                    };
                                }
                                if (charCode > 0x10ffff) {
                                    return {
                                        state,
                                        issues: [
                                            {
                                                type: 'Issue',
                                                msg: `Bad Unicode code point ${tok}`,
                                                severity: 'error',
                                                loc: stream.matchedLocation(),
                                            },
                                        ],
                                    };
                                }
                                else {
                                    tok = String.fromCodePoint(charCode);
                                    break;
                                }
                            }
                        }
                        return {
                            state: {
                                ...state,
                                collected: state.collected + tok,
                                end: stream.matchedLocation().end,
                            },
                            tag: 'escape',
                        };
                    }
                    if ((tok = stream.eat(/^./))) {
                        return {
                            state,
                            tag: 'invalid',
                            issues: [
                                {
                                    type: 'Issue',
                                    msg: `Invalid escape sequence \\${tok}`,
                                    severity: 'error',
                                    loc: stream.matchedLocation(),
                                },
                            ],
                        };
                    }
                    return {
                        state: { type: 'Normal', defaults: state.defaults },
                        tag: 'invalid',
                        issues: [
                            {
                                type: 'Issue',
                                msg: 'Backslash not supported at end of line',
                                severity: 'error',
                                loc: stream.matchedLocation(),
                            },
                        ],
                    };
                }
                throw new Error('Expected-to-be-unimpossible state in string parsing reached');
            case 'Normal':
                if ((tok = stream.eat('#'))) {
                    tok = stream.eat(META_ID_TOKEN) ?? stream.eat(META_NUM_TOKEN);
                    return {
                        state,
                        issues: [
                            {
                                type: 'Issue',
                                msg: `A hash command like '#${tok}' can only appear at the beginning of a declaration`,
                                severity: 'error',
                                loc: stream.matchedLocation(),
                            },
                        ],
                        tag: 'invalid',
                    };
                }
                if (stream.eat(TRIV_TOKEN)) {
                    return { state, tag: 'literal', tree: { type: 'triv', loc: stream.matchedLocation() } };
                }
                if (stream.eat('"')) {
                    return {
                        state: {
                            ...state,
                            type: 'InString',
                            start: stream.matchedLocation().start,
                            end: stream.matchedLocation().end,
                            collected: '',
                        },
                        tag: 'string',
                    };
                }
                for (const p of punct) {
                    if (stream.eat(p)) {
                        return {
                            state: p === '.' ? { ...state, type: 'Beginning' } : state,
                            tag: 'punctuation',
                            issues: p === '?'
                                ? [
                                    {
                                        type: 'Issue',
                                        msg: "Standalone question marks for open rules are deprecated and will be removed in a future version: use 'is?' instead",
                                        severity: 'warning',
                                        loc: stream.matchedLocation(),
                                    },
                                ]
                                : undefined,
                            tree: { type: p, loc: stream.matchedLocation() },
                        };
                    }
                }
                if (stream.eat(/^\s+/)) {
                    return { state };
                }
                if ((tok = stream.eat(META_ID_TOKEN) ?? stream.eat(META_NUM_TOKEN))) {
                    if (tok === 'is') {
                        if (stream.eat('?')) {
                            return {
                                state,
                                tag: 'keyword',
                                tree: { type: 'is?', loc: stream.matchedLocation() },
                            };
                        }
                        return {
                            state,
                            tag: 'keyword',
                            tree: { type: 'is', loc: stream.matchedLocation() },
                        };
                    }
                    if (tok.match(VAR_TOKEN)) {
                        return {
                            state,
                            tag: 'variableName.special',
                            tree: { type: 'var', value: tok, loc: stream.matchedLocation() },
                        };
                    }
                    if (tok.match(INT_TOKEN)) {
                        return {
                            state,
                            tag: 'literal',
                            tree: { type: 'int', value: parseInt(tok), loc: stream.matchedLocation() },
                        };
                    }
                    if (tok.match(CONST_TOKEN)) {
                        for (const [builtin, key] of Object.entries(state.defaults)) {
                            if (tok === key) {
                                return {
                                    state,
                                    tag: 'macroName',
                                    tree: {
                                        type: 'builtin',
                                        value: tok,
                                        builtin: builtin,
                                        loc: stream.matchedLocation(),
                                    },
                                };
                            }
                        }
                        return {
                            state,
                            tag: 'variableName',
                            tree: { type: 'const', value: tok, loc: stream.matchedLocation() },
                        };
                    }
                    if (tok.match(WILDCARD_TOKEN)) {
                        return {
                            state,
                            tag: 'variableName.local',
                            tree: { type: 'wildcard', value: tok, loc: stream.matchedLocation() },
                        };
                    }
                    return {
                        state,
                        tag: 'invalid',
                        issues: [issue(stream, `Invalid identifier '${tok}'`)],
                    };
                }
                tok = stream.eat(/^[^\s]/);
                return {
                    state,
                    tag: 'invalid',
                    issues: [issue(stream, `Unexpected symbol '${tok}'`)],
                };
        }
    },
    handleEof: (state) => {
        if (state.type === 'InString') {
            console.log();
            return {
                state: { type: 'Normal', defaults: state.defaults },
                tag: 'invalid',
                issues: [
                    {
                        type: 'Issue',
                        msg: 'End of string not found at end of input',
                        severity: 'error',
                        loc: { start: state.start, end: state.end },
                    },
                ],
            };
        }
        return null;
    },
};

function makeStream(baseString, lineNumber, startingColumn) {
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

/** Parse a document with the stream parser. */
function parseWithStreamParser(parser, str) {
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

class DusaSyntaxError extends SyntaxError {
    constructor(msg, loc) {
        super();
        this.name = 'DusaSyntaxError';
        this.message = msg;
        this.loc = loc;
    }
}
function parse(str) {
    const tokens = parseWithStreamParser(dusaTokenizer, str);
    for (const issue of tokens.issues) {
        if (issue.severity === 'warning') {
            console.error(`Parse warning: ${issue.msg} at line ${issue.loc?.start.line}`);
        }
    }
    if (tokens.issues.filter(({ severity }) => severity === 'error').length > 0) {
        return { errors: tokens.issues };
    }
    const parseResult = parseTokens(tokens.document);
    const parseIssues = parseResult.filter((decl) => decl.type === 'Issue');
    const parseDecls = parseResult.filter((decl) => decl.type !== 'Issue');
    // If parsing phase gives warning-level issues, this will need to be modified as above
    if (parseIssues.length > 0) {
        return { errors: parseIssues };
    }
    return { errors: null, document: parseDecls };
}
function parseDeclOrIssue(t) {
    try {
        return parseDecl(t);
    }
    catch (e) {
        if (e instanceof DusaSyntaxError) {
            let next;
            while ((next = t.next()) !== null && next.type !== '.')
                ;
            return { type: 'Issue', msg: e.message, severity: 'error', loc: e.loc };
        }
        else {
            throw e;
        }
    }
}
function parseTokens(tokens) {
    const t = mkStream(tokens);
    const result = [];
    let decl = parseDeclOrIssue(t);
    while (decl !== null) {
        result.push(decl);
        decl = parseDeclOrIssue(t);
    }
    return result;
}
function mkStream(xs) {
    let i = 0;
    return {
        next() {
            if (i >= xs.length)
                return null;
            return xs[i++];
        },
        peek() {
            if (i >= xs.length)
                return null;
            return xs[i];
        },
    };
}
function force(t, type) {
    const tok = t.next();
    if (tok === null)
        throw new DusaSyntaxError(`Expected ${type}, found end of input.`);
    if (tok.type !== type)
        throw new DusaSyntaxError(`Expected ${type}, found ${tok.type}`, tok.loc);
    return tok;
}
function chomp(t, type) {
    if (t.peek()?.type === type) {
        return t.next();
    }
    else {
        return null;
    }
}
function forceFullTerm(t) {
    const result = parseFullTerm(t);
    if (result === null) {
        throw new DusaSyntaxError('Expected a term, but no term found', t.peek()?.loc ?? undefined);
    }
    return result;
}
function parseHeadValue(t) {
    const isToken = chomp(t, 'is') || chomp(t, 'is?');
    if (!isToken) {
        return { values: null, exhaustive: true, end: null };
    }
    let tok;
    if ((tok = chomp(t, '{')) !== null) {
        const values = [];
        let exhaustive = isToken.type === 'is';
        let end = tok.loc.end;
        if (chomp(t, '?')) {
            exhaustive = false;
        }
        else {
            values.push(forceFullTerm(t));
        }
        let deprecatedQuestionMark = undefined;
        while ((tok = chomp(t, '}')) === null) {
            if (chomp(t, ',')) {
                values.push(forceFullTerm(t));
            }
            else {
                deprecatedQuestionMark = force(t, '?');
                if (isToken.type === 'is?') {
                    throw new DusaSyntaxError(`Rule conclusion cannot use both 'is?' and deprecated standalone question mark`, deprecatedQuestionMark.loc);
                }
                end = force(t, '}').loc.end;
                exhaustive = false;
                break;
            }
        }
        return { values, exhaustive, end: tok?.loc.end ?? end, deprecatedQuestionMark };
    }
    else {
        const value = parseFullTerm(t);
        if (value === null) {
            throw new DusaSyntaxError(`Did not find value after '${isToken.type}'`, isToken.loc);
        }
        return { values: [value], exhaustive: isToken.type === 'is', end: value.loc.end };
    }
}
const BINARY_PREDICATES = {
    '==': 'Equality',
    '!=': 'Inequality',
    '<=': 'Leq',
    '<': 'Lt',
    '>=': 'Geq',
    '>': 'Gt',
};
function forcePremise(t) {
    const a = forceFullTerm(t);
    for (const [tok, type] of Object.entries(BINARY_PREDICATES)) {
        if (chomp(t, tok)) {
            const b = forceFullTerm(t);
            return { type, a, b, loc: { start: a.loc.start, end: b.loc.end } };
        }
    }
    if (a.type !== 'const') {
        throw new DusaSyntaxError(`Expected an attribute, found a '${a.type}'`, a.loc);
    }
    if (chomp(t, 'is')) {
        const value = forceFullTerm(t);
        return {
            type: 'Proposition',
            name: a.name,
            args: a.args,
            value,
            loc: { start: a.loc.start, end: value.loc.end },
        };
    }
    return {
        type: 'Proposition',
        name: a.name,
        args: a.args,
        value: null,
        loc: a.loc,
    };
}
function parseDecl(t) {
    let tok = t.next();
    if (tok === null)
        return null;
    let result;
    const start = tok.loc.start;
    if (tok.type === 'hashdirective') {
        if (tok.value === 'forbid') {
            result = {
                type: 'Forbid',
                premises: [],
                loc: tok.loc, // dummy value, will be replaced
            };
        }
        else if (tok.value === 'demand') {
            result = {
                type: 'Demand',
                premises: [],
                loc: tok.loc,
            };
        }
        else {
            throw new DusaSyntaxError(`Unexpected directive '${tok.value}'. Valid directives are #builtin, #demand, and #forbid.`);
        }
    }
    else if (tok.type === ':-') {
        throw new DusaSyntaxError(`Declaration started with ':-' (use #forbid instead)`, tok.loc);
    }
    else if (tok.type === 'const') {
        const name = tok.value;
        let attributeEnd = tok.loc.end;
        const args = [];
        let next = parseTerm(t);
        while (next !== null) {
            attributeEnd = next.loc.end;
            args.push(next);
            next = parseTerm(t);
        }
        const { values, exhaustive, end, deprecatedQuestionMark } = parseHeadValue(t);
        result = {
            type: 'Rule',
            premises: [],
            conclusion: { name, args, values, exhaustive, loc: { start, end: end ?? attributeEnd } },
            loc: tok.loc,
            deprecatedQuestionMark: deprecatedQuestionMark?.loc,
        };
        if ((tok = chomp(t, '.')) !== null) {
            return { ...result, loc: { start, end: tok.loc.end } };
        }
        force(t, ':-');
    }
    else {
        throw new DusaSyntaxError(`Unexpected token '${tok.type}' at start of declaration`, tok.loc);
    }
    result.premises.push(forcePremise(t));
    while ((tok = chomp(t, '.')) === null) {
        force(t, ',');
        result.premises.push(forcePremise(t));
    }
    return { ...result, loc: { start, end: tok.loc.end } };
}
function parseFullTerm(t) {
    const tok = t.peek();
    if (tok?.type === 'const' || tok?.type === 'builtin') {
        t.next();
        const args = [];
        let endLoc = tok.loc.end;
        let next = parseTerm(t);
        while (next !== null) {
            endLoc = next.loc.end;
            args.push(next);
            next = parseTerm(t);
        }
        if (tok.type === 'const') {
            return {
                type: 'const',
                name: tok.value,
                args,
                loc: { start: tok.loc.start, end: endLoc },
            };
        }
        return {
            type: 'special',
            name: tok.builtin,
            symbol: tok.value,
            args,
            loc: { start: tok.loc.start, end: endLoc },
        };
    }
    return parseTerm(t);
}
function parseTerm(t) {
    const tok = t.peek();
    if (tok === null)
        return null;
    if (tok.type === '(') {
        t.next();
        const result = parseFullTerm(t);
        if (result === null) {
            throw new DusaSyntaxError('No term following an open parenthesis', {
                start: tok.loc.start,
                end: t.peek()?.loc.end ?? tok.loc.end,
            });
        }
        const closeParen = t.next();
        if (closeParen?.type !== ')') {
            throw new DusaSyntaxError('Did not find expected matching parenthesis', {
                start: tok.loc.start,
                end: closeParen?.loc.end ?? result.loc.end,
            });
        }
        return result;
    }
    if (tok.type === 'triv') {
        t.next();
        return { type: 'triv', loc: tok.loc };
    }
    if (tok.type === 'var') {
        t.next();
        return { type: 'var', name: tok.value, loc: tok.loc };
    }
    if (tok.type === 'wildcard') {
        t.next();
        return { type: 'wildcard', name: tok.value === '_' ? null : tok.value, loc: tok.loc };
    }
    if (tok.type === 'int') {
        t.next();
        return { type: 'int', value: tok.value, loc: tok.loc };
    }
    if (tok.type === 'string') {
        t.next();
        return { type: 'string', value: tok.value, loc: tok.loc };
    }
    if (tok.type === 'const') {
        t.next();
        return { type: 'const', name: tok.value, args: [], loc: tok.loc };
    }
    if (tok.type === 'builtin') {
        t.next();
        return { type: 'special', name: tok.builtin, symbol: tok.value, args: [], loc: tok.loc };
    }
    return null;
}

function dataToTerm(d) {
    const view = expose(d);
    if (view.type === 'triv')
        return null;
    if (view.type === 'int')
        return view.value;
    if (view.type === 'bool')
        return view.value;
    if (view.type === 'string')
        return view.value;
    if (view.type === 'ref')
        return { name: null, value: view.value };
    if (view.args.length === 0)
        return { name: view.name };
    const args = view.args.map(dataToTerm);
    return { name: view.name, args };
}
function termToData(tm) {
    if (tm === null)
        return TRIV_DATA;
    if (typeof tm === 'boolean')
        return hide({ type: 'bool', value: tm });
    if (typeof tm === 'string')
        return hide({ type: 'string', value: tm });
    if (typeof tm === 'bigint')
        return hide({ type: 'int', value: tm });
    if (typeof tm === 'object') {
        if (tm.name === null)
            return hide({ type: 'ref', value: tm.value });
        return hide({ type: 'const', name: tm.name, args: tm.args?.map(termToData) ?? [] });
    }
    return hide({ type: 'int', value: BigInt(tm) });
}

function loadJson(json, facts) {
    if (json === null ||
        typeof json === 'number' ||
        typeof json === 'string' ||
        typeof json === 'bigint') {
        return termToData(json);
    }
    const ref = getRef();
    if (Array.isArray(json)) {
        for (const [index, value] of json.entries()) {
            const dataValue = loadJson(value, facts);
            facts.push([ref, hide({ type: 'int', value: BigInt(index) }), dataValue]);
        }
    }
    else if (typeof json === 'object') {
        for (const [field, value] of Object.entries(json)) {
            const dataValue = loadJson(value, facts);
            facts.push([ref, hide({ type: 'string', value: field }), dataValue]);
        }
    }
    else {
        throw new DusaError([
            {
                type: 'Issue',
                msg: `Could not load ${typeof json} as JSON data triples`,
                severity: 'error',
            },
        ]);
    }
    return ref;
}
class DusaError extends Error {
    constructor(issues) {
        super();
        this.issues = issues;
    }
}
class DusaSolution {
    constructor(db) {
        this.db = db;
    }
    get facts() {
        function* map(iter) {
            for (const { name, args, value } of iter) {
                yield { name, args: args.map(dataToTerm), value: dataToTerm(value) };
            }
        }
        return map(listFacts(this.db));
    }
    lookup(name, ...args) {
        function* map(iter) {
            for (const { args, value } of iter) {
                yield [...args.map(dataToTerm), dataToTerm(value)];
            }
        }
        return map(lookup(this.db, name, args.map(termToData)));
    }
    get(name, ...args) {
        const value = get(this.db, name, args.map(termToData));
        if (value === undefined)
            return undefined;
        return dataToTerm(value);
    }
    has(name, ...args) {
        const value = get(this.db, name, args.map(termToData));
        return value !== undefined;
    }
}
function* solutionGenerator(program, db, stats, debug) {
    let tree = db === null ? null : { type: 'leaf', db: db };
    let path = [];
    while (tree !== null) {
        if (debug)
            console.log(pathToString(tree, path));
        const result = stepTreeRandomDFS(program, tree, path, stats);
        tree = result.tree;
        path = result.tree === null ? path : result.path;
        if (result.solution) {
            yield new DusaSolution(result.solution);
        }
    }
}
class Dusa {
    advanceDb() {
        let db = this.db;
        while (db.queue.length > 0 && (db = stepDb(this.program, db)) !== null) {
            this.db = db;
        }
    }
    constructor(source, debug = false) {
        this.cachedSolution = null;
        const parsed = parse(source);
        if (parsed.errors !== null) {
            throw new DusaError(parsed.errors);
        }
        const { errors, arities } = check(parsed.document);
        if (errors.length !== 0) {
            throw new DusaError(errors);
        }
        this.debug = debug;
        this.arities = arities;
        this.program = compile(parsed.document, debug);
        this.db = makeInitialDb(this.program);
        this.stats = { cycles: 0, deadEnds: 0 };
    }
    checkPredicateForm(pred, arity) {
        const expected = this.arities.get(pred);
        if (!pred.match(/^[a-z][A-Za-z0-9]*$/)) {
            throw new DusaError([
                {
                    type: 'Issue',
                    msg: `Asserted predicates must start with a lowercase letter and include only alphanumeric characters, '${pred}' does not.`,
                    severity: 'error',
                },
            ]);
        }
        if (expected === undefined) {
            this.arities.set(pred, arity);
        }
        else if (arity !== expected) {
            throw new DusaError([
                {
                    type: 'Issue',
                    msg: `Predicate ${pred} should have ${expected} argument${expected === 1 ? '' : 's'}, but the asserted fact has ${arity}`,
                    severity: 'error',
                },
            ]);
        }
    }
    /**
     * Add new facts to the database. These will affect the results of any
     * subsequent solutions.
     */
    assert(...facts) {
        this.cachedSolution = null;
        this.db = { ...this.db };
        for (const { name, args, value } of facts) {
            this.checkPredicateForm(name, args.length);
            insertFact(name, args.map(termToData), value === undefined ? TRIV_DATA : termToData(value), this.db);
        }
    }
    /**
     * Insert the structure of a JSON object into the database. If no two-place
     * predicate is provided, these facts will be added with the special built-in
     * predicate `->`, which is represented with (left-associative) infix notation
     * in Dusa.
     */
    load(json, pred) {
        this.cachedSolution = null;
        this.db = { ...this.db };
        if (pred !== undefined) {
            this.checkPredicateForm(pred, 2);
        }
        const usedPred = pred ?? '->';
        const triples = [];
        const rep = loadJson(json, triples);
        for (const [obj, key, value] of triples) {
            insertFact(usedPred, [obj, key], value, this.db);
        }
        return dataToTerm(rep);
    }
    get solutions() {
        this.advanceDb();
        return solutionGenerator(this.program, this.db, this.stats, this.debug);
    }
    get solution() {
        if (this.cachedSolution)
            return this.cachedSolution;
        const iterator = this.solutions;
        const result = iterator.next();
        if (result.done)
            return null;
        if (!iterator.next().done) {
            throw new DusaError([
                {
                    type: 'Issue',
                    msg: "Cannot use 'solution' getter on programs with multiple solutions. Use sample() instead.",
                    severity: 'error',
                },
            ]);
        }
        this.cachedSolution = result.value;
        return result.value;
    }
    sample() {
        const result = this.solutions.next();
        if (result.done)
            return null;
        return result.value;
    }
}

exports.DANGER_RESET_DATA = DANGER_RESET_DATA;
exports.Dusa = Dusa;
exports.DusaError = DusaError;
exports.DusaSolution = DusaSolution;
exports.dataToTerm = dataToTerm;
exports.termToData = termToData;
