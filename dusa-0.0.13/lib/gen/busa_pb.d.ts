import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from '@bufbuild/protobuf';
import { Message, proto3 } from '@bufbuild/protobuf';
/**
 * @generated from message Pattern
 */
export declare class Pattern extends Message<Pattern> {
    /**
     * @generated from oneof Pattern.is
     */
    is: {
        /**
         * @generated from field: Pattern.PatternEnum enum = 1;
         */
        value: Pattern_PatternEnum;
        case: 'enum';
    } | {
        /**
         * @generated from field: bool bool = 2;
         */
        value: boolean;
        case: 'bool';
    } | {
        /**
         * @generated from field: int32 var = 3;
         */
        value: number;
        case: 'var';
    } | {
        /**
         * @generated from field: int64 int = 4;
         */
        value: bigint;
        case: 'int';
    } | {
        /**
         * @generated from field: string string = 5;
         */
        value: string;
        case: 'string';
    } | {
        /**
         * @generated from field: Pattern.Structure structure = 6;
         */
        value: Pattern_Structure;
        case: 'structure';
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Pattern>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Pattern";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Pattern;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Pattern;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Pattern;
    static equals(a: Pattern | PlainMessage<Pattern> | undefined, b: Pattern | PlainMessage<Pattern> | undefined): boolean;
}
/**
 * @generated from enum Pattern.PatternEnum
 */
export declare enum Pattern_PatternEnum {
    /**
     * @generated from enum value: Unit = 0;
     */
    Unit = 0,
    /**
     * @generated from enum value: Wildcard = 1;
     */
    Wildcard = 1
}
/**
 * @generated from message Pattern.Structure
 */
export declare class Pattern_Structure extends Message<Pattern_Structure> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: repeated Pattern args = 2;
     */
    args: Pattern[];
    constructor(data?: PartialMessage<Pattern_Structure>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Pattern.Structure";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Pattern_Structure;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Pattern_Structure;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Pattern_Structure;
    static equals(a: Pattern_Structure | PlainMessage<Pattern_Structure> | undefined, b: Pattern_Structure | PlainMessage<Pattern_Structure> | undefined): boolean;
}
/**
 * @generated from message Rule
 */
export declare class Rule extends Message<Rule> {
    /**
     * @generated from oneof Rule.is
     */
    is: {
        /**
         * @generated from field: Rule.Index index = 1;
         */
        value: Rule_Index;
        case: 'index';
    } | {
        /**
         * @generated from field: Rule.Join join = 2;
         */
        value: Rule_Join;
        case: 'join';
    } | {
        /**
         * @generated from field: Rule.Function function = 3;
         */
        value: Rule_Function;
        case: 'function';
    } | {
        /**
         * @generated from field: Rule.ChoiceConclusion choice_conclusion = 4;
         */
        value: Rule_ChoiceConclusion;
        case: 'choiceConclusion';
    } | {
        /**
         * @generated from field: Rule.DatalogConclusion datalog_conclusion = 5;
         */
        value: Rule_DatalogConclusion;
        case: 'datalogConclusion';
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Rule>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Rule";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Rule;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Rule;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Rule;
    static equals(a: Rule | PlainMessage<Rule> | undefined, b: Rule | PlainMessage<Rule> | undefined): boolean;
}
/**
 *
 * conclusion X0 ... XN :- premise <Args> is <Values>.
 *
 * - Premise uses arbitrary patterns with vars X0...XN
 * - Every variable is bound in the premise
 * - Conclusion has arguments in order
 * - Conclusion is a fact (with all args, no values)
 *
 * @generated from message Rule.Index
 */
export declare class Rule_Index extends Message<Rule_Index> {
    /**
     * @generated from field: string conclusion = 1;
     */
    conclusion: string;
    /**
     * @generated from field: int32 num_conclusion_args = 2;
     */
    numConclusionArgs: number;
    /**
     * @generated from field: string premise = 3;
     */
    premise: string;
    /**
     * @generated from field: repeated Pattern args = 4;
     */
    args: Pattern[];
    /**
     * @generated from field: repeated Pattern values = 5;
     */
    values: Pattern[];
    constructor(data?: PartialMessage<Rule_Index>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Rule.Index";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Rule_Index;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Rule_Index;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Rule_Index;
    static equals(a: Rule_Index | PlainMessage<Rule_Index> | undefined, b: Rule_Index | PlainMessage<Rule_Index> | undefined): boolean;
}
/**
 *
 * conclusion <Args> is <Values> :- prefix X0 ... XN
 *
 * - Premise has arguments X0 ... XN in order
 * - Conclusion has arbitrary patterns with vars X0...XN
 * - Conclusion is a fact
 *
 * @generated from message Rule.DatalogConclusion
 */
export declare class Rule_DatalogConclusion extends Message<Rule_DatalogConclusion> {
    /**
     * @generated from field: string conclusion = 1;
     */
    conclusion: string;
    /**
     * @generated from field: repeated Pattern args = 2;
     */
    args: Pattern[];
    /**
     * @generated from field: repeated Pattern values = 3;
     */
    values: Pattern[];
    /**
     * @generated from field: string prefix = 4;
     */
    prefix: string;
    constructor(data?: PartialMessage<Rule_DatalogConclusion>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Rule.DatalogConclusion";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Rule_DatalogConclusion;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Rule_DatalogConclusion;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Rule_DatalogConclusion;
    static equals(a: Rule_DatalogConclusion | PlainMessage<Rule_DatalogConclusion> | undefined, b: Rule_DatalogConclusion | PlainMessage<Rule_DatalogConclusion> | undefined): boolean;
}
/**
 *
 * conclusion <Args> is { <Values> } :- prefix X0 ... XN (exhaustive)
 * conclusion <Args> is { <Values>? } :- prefix X0 ... XN (non-exhaustive)
 *
 * - Premise has arguments X0 ... XN in order
 * - Conclusion has arbitrary patterns with vars X0...XN
 * - Conclusion is a fact with one value
 *
 * @generated from message Rule.ChoiceConclusion
 */
export declare class Rule_ChoiceConclusion extends Message<Rule_ChoiceConclusion> {
    /**
     * @generated from field: string conclusion = 1;
     */
    conclusion: string;
    /**
     * @generated from field: repeated Pattern args = 2;
     */
    args: Pattern[];
    /**
     * @generated from field: repeated Pattern choices = 3;
     */
    choices: Pattern[];
    /**
     * @generated from field: bool exhaustive = 4;
     */
    exhaustive: boolean;
    /**
     * @generated from field: string prefix = 5;
     */
    prefix: string;
    constructor(data?: PartialMessage<Rule_ChoiceConclusion>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Rule.ChoiceConclusion";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Rule_ChoiceConclusion;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Rule_ChoiceConclusion;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Rule_ChoiceConclusion;
    static equals(a: Rule_ChoiceConclusion | PlainMessage<Rule_ChoiceConclusion> | undefined, b: Rule_ChoiceConclusion | PlainMessage<Rule_ChoiceConclusion> | undefined): boolean;
}
/**
 *
 * conclusion Y3 X1 Z4 :- prefix X0 X1 Y2 Y3, fact X0 X1 Z2 is Z3 Z4.
 *
 * - Prefix and fact premise share first N arguments X0...XN
 * - prefix can have additional arguments ...YM, M >= N
 * - fact can have additional arguments in args and values ...ZP, P >= N
 * - conclusion is another prefix and has no repeat variables
 *
 * @generated from message Rule.Join
 */
export declare class Rule_Join extends Message<Rule_Join> {
    /**
     * @generated from field: string conclusion = 1;
     */
    conclusion: string;
    /**
     * @generated from field: repeated Rule.Join.JoinPattern args = 2;
     */
    args: Rule_Join_JoinPattern[];
    /**
     * @generated from field: string prefix = 3;
     */
    prefix: string;
    /**
     * @generated from field: string fact = 4;
     */
    fact: string;
    /**
     * @generated from field: int32 num_shared = 5;
     */
    numShared: number;
    constructor(data?: PartialMessage<Rule_Join>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Rule.Join";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Rule_Join;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Rule_Join;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Rule_Join;
    static equals(a: Rule_Join | PlainMessage<Rule_Join> | undefined, b: Rule_Join | PlainMessage<Rule_Join> | undefined): boolean;
}
/**
 * @generated from message Rule.Join.JoinPattern
 */
export declare class Rule_Join_JoinPattern extends Message<Rule_Join_JoinPattern> {
    /**
     * @generated from field: Rule.Join.JoinPattern.JoinLocation loc = 1;
     */
    loc: Rule_Join_JoinPattern_JoinLocation;
    /**
     * @generated from field: int32 var = 2;
     */
    var: number;
    constructor(data?: PartialMessage<Rule_Join_JoinPattern>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Rule.Join.JoinPattern";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Rule_Join_JoinPattern;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Rule_Join_JoinPattern;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Rule_Join_JoinPattern;
    static equals(a: Rule_Join_JoinPattern | PlainMessage<Rule_Join_JoinPattern> | undefined, b: Rule_Join_JoinPattern | PlainMessage<Rule_Join_JoinPattern> | undefined): boolean;
}
/**
 * @generated from enum Rule.Join.JoinPattern.JoinLocation
 */
export declare enum Rule_Join_JoinPattern_JoinLocation {
    /**
     * @generated from enum value: Shared = 0;
     */
    Shared = 0,
    /**
     * @generated from enum value: Prefix = 1;
     */
    Prefix = 1,
    /**
     * @generated from enum value: FactArg = 2;
     */
    FactArg = 2,
    /**
     * @generated from enum value: FactValue = 3;
     */
    FactValue = 3
}
/**
 *
 * conclusion X2 X4 X3 :- prefix X0 X1 X2 X3, <built-in-premise>
 *
 * - There are various extra constraints on each built-in premises,
 * but they can be forced to bind additional variables in some cases,
 * which can then be used in the conclusion (again, in some cases).
 * - conclusion is another prefix and has no repeat variables
 *
 * @generated from message Rule.Function
 */
export declare class Rule_Function extends Message<Rule_Function> {
    /**
     * @generated from field: string conclusion = 1;
     */
    conclusion: string;
    /**
     * @generated from field: repeated int32 args = 2;
     */
    args: number[];
    /**
     * @generated from field: string prefix = 3;
     */
    prefix: string;
    /**
     * @generated from oneof Rule.Function.type
     */
    type: {
        /**
         * @generated from field: Rule.Function.Builtin builtin = 4;
         */
        value: Rule_Function_Builtin;
        case: 'builtin';
    } | {
        /**
         * @generated from field: string other = 5;
         */
        value: string;
        case: 'other';
    } | {
        case: undefined;
        value?: undefined;
    };
    /**
     * @generated from field: repeated Pattern function_args = 6;
     */
    functionArgs: Pattern[];
    /**
     * @generated from field: int32 num_vars = 7;
     */
    numVars: number;
    constructor(data?: PartialMessage<Rule_Function>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Rule.Function";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Rule_Function;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Rule_Function;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Rule_Function;
    static equals(a: Rule_Function | PlainMessage<Rule_Function> | undefined, b: Rule_Function | PlainMessage<Rule_Function> | undefined): boolean;
}
/**
 * @generated from enum Rule.Function.Builtin
 */
export declare enum Rule_Function_Builtin {
    /**
     * @generated from enum value: BOOLEAN_TRUE = 0;
     */
    BOOLEAN_TRUE = 0,
    /**
     * @generated from enum value: BOOLEAN_FALSE = 1;
     */
    BOOLEAN_FALSE = 1,
    /**
     * @generated from enum value: NAT_ZERO = 2;
     */
    NAT_ZERO = 2,
    /**
     * @generated from enum value: NAT_SUCC = 3;
     */
    NAT_SUCC = 3,
    /**
     * @generated from enum value: INT_PLUS = 4;
     */
    INT_PLUS = 4,
    /**
     * @generated from enum value: INT_MINUS = 5;
     */
    INT_MINUS = 5,
    /**
     * @generated from enum value: INT_TIMES = 6;
     */
    INT_TIMES = 6,
    /**
     * @generated from enum value: STRING_CONCAT = 7;
     */
    STRING_CONCAT = 7,
    /**
     * @generated from enum value: EQUAL = 8;
     */
    EQUAL = 8,
    /**
     * @generated from enum value: GT = 9;
     */
    GT = 9,
    /**
     * @generated from enum value: GEQ = 10;
     */
    GEQ = 10
}
/**
 * @generated from message Program
 */
export declare class Program extends Message<Program> {
    /**
     * @generated from field: repeated Rule rules = 1;
     */
    rules: Rule[];
    /**
     * @generated from field: repeated string seeds = 2;
     */
    seeds: string[];
    /**
     * @generated from field: repeated string forbids = 3;
     */
    forbids: string[];
    /**
     * @generated from field: repeated string demands = 4;
     */
    demands: string[];
    constructor(data?: PartialMessage<Program>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "Program";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Program;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Program;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Program;
    static equals(a: Program | PlainMessage<Program> | undefined, b: Program | PlainMessage<Program> | undefined): boolean;
}
