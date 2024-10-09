import { expose, hide } from './data.js';
import { DataMap } from './datamap.js';
export class AttributeMap {
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
