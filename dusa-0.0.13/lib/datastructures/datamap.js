function height(t) {
    return t === null ? 0 : t.height;
}
function size(t) {
    return t === null ? 0 : t.size;
}
function lookup(t, key) {
    if (t === null)
        return null;
    if (t.key === key)
        return t.value;
    return key < t.key ? lookup(t.left, key) : lookup(t.right, key);
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
function remove(t, key) {
    if (t === null)
        return null;
    if (key < t.key) {
        const result = remove(t.left, key);
        return result === null ? null : [result[0], createAndFix(t.key, t.value, result[1], t.right)];
    }
    if (key > t.key) {
        const result = remove(t.right, key);
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
export class DataMap {
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
            return lookup(this.bigintTree, key);
        return lookup(this.indexTree, key);
    }
    getNth(n) {
        if (n < size(this.indexTree))
            return getNth(this.indexTree, n);
        return getNth(this.bigintTree, n - size(this.indexTree));
    }
    remove(key) {
        if (typeof key === 'bigint') {
            const result = remove(this.bigintTree, key);
            if (result === null)
                return null;
            return [result[0], new DataMap(this.indexTree, result[1])];
        }
        const result = remove(this.indexTree, key);
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
        t = lookup(t.child, key);
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
    const subTrie = lookup(t.child, keys[index]);
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
export class TrieMap {
    constructor(t) {
        this.t = t;
    }
    static new() {
        return new TrieMap(null);
    }
    arity(name) {
        const trie = lookup(this.t, name);
        if (trie === null)
            return null;
        return trie.depth ?? 0;
    }
    set(name, args, value) {
        const trie = lookup(this.t, name);
        if (trie !== null && args.length !== (trie.depth ?? 0)) {
            throw new Error(`Attribute ${name} has ${trie.depth} arguments, but set was given ${args.length} arguments`);
        }
        const { result, removed } = trieInsert(0, args, value, trie);
        return { result: new TrieMap(insert(this.t, name, result)), removed };
    }
    get(name, args) {
        const trie = lookup(this.t, name);
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
        const trie = trieLookup(args, lookup(this.t, name));
        if (trie === null)
            return [][Symbol.iterator]();
        return visitTrieInOrder(trie);
    }
    entries() {
        return trieMapEntries(this.t);
    }
}
