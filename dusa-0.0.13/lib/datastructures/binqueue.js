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
export default class PQ {
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
