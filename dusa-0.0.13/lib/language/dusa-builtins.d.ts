export declare const BUILT_IN_MAP: {
    readonly BOOLEAN_TRUE: string | null;
    readonly BOOLEAN_FALSE: string | null;
    readonly NAT_ZERO: string | null;
    readonly NAT_SUCC: string | null;
    readonly INT_PLUS: string | null;
    readonly INT_MINUS: string | null;
    readonly INT_TIMES: string | null;
    readonly STRING_CONCAT: string | null;
    readonly EQUAL: string | null;
    readonly GT: string | null;
    readonly GEQ: string | null;
};
export type BUILT_IN_PRED = keyof typeof BUILT_IN_MAP;
