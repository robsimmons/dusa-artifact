import { TRIV_DATA, expose, hide } from './datastructures/data.js';
export function dataToTerm(d) {
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
export function termToData(tm) {
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
