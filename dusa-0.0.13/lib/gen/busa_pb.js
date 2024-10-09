// npx buf generate proto
import { Message, proto3 } from '@bufbuild/protobuf';
/**
 * @generated from message Pattern
 */
export class Pattern extends Message {
    constructor(data) {
        super();
        /**
         * @generated from oneof Pattern.is
         */
        this.is = { case: undefined };
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Pattern().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Pattern().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Pattern().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Pattern, a, b);
    }
}
Pattern.runtime = proto3;
Pattern.typeName = 'Pattern';
Pattern.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'enum', kind: 'enum', T: proto3.getEnumType(Pattern_PatternEnum), oneof: 'is' },
    { no: 2, name: 'bool', kind: 'scalar', T: 8 /* ScalarType.BOOL */, oneof: 'is' },
    { no: 3, name: 'var', kind: 'scalar', T: 5 /* ScalarType.INT32 */, oneof: 'is' },
    { no: 4, name: 'int', kind: 'scalar', T: 3 /* ScalarType.INT64 */, oneof: 'is' },
    { no: 5, name: 'string', kind: 'scalar', T: 9 /* ScalarType.STRING */, oneof: 'is' },
    { no: 6, name: 'structure', kind: 'message', T: Pattern_Structure, oneof: 'is' },
]);
/**
 * @generated from enum Pattern.PatternEnum
 */
export var Pattern_PatternEnum;
(function (Pattern_PatternEnum) {
    /**
     * @generated from enum value: Unit = 0;
     */
    Pattern_PatternEnum[Pattern_PatternEnum["Unit"] = 0] = "Unit";
    /**
     * @generated from enum value: Wildcard = 1;
     */
    Pattern_PatternEnum[Pattern_PatternEnum["Wildcard"] = 1] = "Wildcard";
})(Pattern_PatternEnum || (Pattern_PatternEnum = {}));
// Retrieve enum metadata with: proto3.getEnumType(Pattern_PatternEnum)
proto3.util.setEnumType(Pattern_PatternEnum, 'Pattern.PatternEnum', [
    { no: 0, name: 'Unit' },
    { no: 1, name: 'Wildcard' },
]);
/**
 * @generated from message Pattern.Structure
 */
export class Pattern_Structure extends Message {
    constructor(data) {
        super();
        /**
         * @generated from field: string name = 1;
         */
        this.name = '';
        /**
         * @generated from field: repeated Pattern args = 2;
         */
        this.args = [];
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Pattern_Structure().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Pattern_Structure().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Pattern_Structure().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Pattern_Structure, a, b);
    }
}
Pattern_Structure.runtime = proto3;
Pattern_Structure.typeName = 'Pattern.Structure';
Pattern_Structure.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'name', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 2, name: 'args', kind: 'message', T: Pattern, repeated: true },
]);
/**
 * @generated from message Rule
 */
export class Rule extends Message {
    constructor(data) {
        super();
        /**
         * @generated from oneof Rule.is
         */
        this.is = { case: undefined };
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Rule().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Rule().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Rule().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Rule, a, b);
    }
}
Rule.runtime = proto3;
Rule.typeName = 'Rule';
Rule.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'index', kind: 'message', T: Rule_Index, oneof: 'is' },
    { no: 2, name: 'join', kind: 'message', T: Rule_Join, oneof: 'is' },
    { no: 3, name: 'function', kind: 'message', T: Rule_Function, oneof: 'is' },
    { no: 4, name: 'choice_conclusion', kind: 'message', T: Rule_ChoiceConclusion, oneof: 'is' },
    { no: 5, name: 'datalog_conclusion', kind: 'message', T: Rule_DatalogConclusion, oneof: 'is' },
]);
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
export class Rule_Index extends Message {
    constructor(data) {
        super();
        /**
         * @generated from field: string conclusion = 1;
         */
        this.conclusion = '';
        /**
         * @generated from field: int32 num_conclusion_args = 2;
         */
        this.numConclusionArgs = 0;
        /**
         * @generated from field: string premise = 3;
         */
        this.premise = '';
        /**
         * @generated from field: repeated Pattern args = 4;
         */
        this.args = [];
        /**
         * @generated from field: repeated Pattern values = 5;
         */
        this.values = [];
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Rule_Index().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Rule_Index().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Rule_Index().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Rule_Index, a, b);
    }
}
Rule_Index.runtime = proto3;
Rule_Index.typeName = 'Rule.Index';
Rule_Index.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'conclusion', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 2, name: 'num_conclusion_args', kind: 'scalar', T: 5 /* ScalarType.INT32 */ },
    { no: 3, name: 'premise', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 4, name: 'args', kind: 'message', T: Pattern, repeated: true },
    { no: 5, name: 'values', kind: 'message', T: Pattern, repeated: true },
]);
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
export class Rule_DatalogConclusion extends Message {
    constructor(data) {
        super();
        /**
         * @generated from field: string conclusion = 1;
         */
        this.conclusion = '';
        /**
         * @generated from field: repeated Pattern args = 2;
         */
        this.args = [];
        /**
         * @generated from field: repeated Pattern values = 3;
         */
        this.values = [];
        /**
         * @generated from field: string prefix = 4;
         */
        this.prefix = '';
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Rule_DatalogConclusion().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Rule_DatalogConclusion().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Rule_DatalogConclusion().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Rule_DatalogConclusion, a, b);
    }
}
Rule_DatalogConclusion.runtime = proto3;
Rule_DatalogConclusion.typeName = 'Rule.DatalogConclusion';
Rule_DatalogConclusion.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'conclusion', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 2, name: 'args', kind: 'message', T: Pattern, repeated: true },
    { no: 3, name: 'values', kind: 'message', T: Pattern, repeated: true },
    { no: 4, name: 'prefix', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
]);
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
export class Rule_ChoiceConclusion extends Message {
    constructor(data) {
        super();
        /**
         * @generated from field: string conclusion = 1;
         */
        this.conclusion = '';
        /**
         * @generated from field: repeated Pattern args = 2;
         */
        this.args = [];
        /**
         * @generated from field: repeated Pattern choices = 3;
         */
        this.choices = [];
        /**
         * @generated from field: bool exhaustive = 4;
         */
        this.exhaustive = false;
        /**
         * @generated from field: string prefix = 5;
         */
        this.prefix = '';
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Rule_ChoiceConclusion().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Rule_ChoiceConclusion().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Rule_ChoiceConclusion().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Rule_ChoiceConclusion, a, b);
    }
}
Rule_ChoiceConclusion.runtime = proto3;
Rule_ChoiceConclusion.typeName = 'Rule.ChoiceConclusion';
Rule_ChoiceConclusion.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'conclusion', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 2, name: 'args', kind: 'message', T: Pattern, repeated: true },
    { no: 3, name: 'choices', kind: 'message', T: Pattern, repeated: true },
    { no: 4, name: 'exhaustive', kind: 'scalar', T: 8 /* ScalarType.BOOL */ },
    { no: 5, name: 'prefix', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
]);
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
export class Rule_Join extends Message {
    constructor(data) {
        super();
        /**
         * @generated from field: string conclusion = 1;
         */
        this.conclusion = '';
        /**
         * @generated from field: repeated Rule.Join.JoinPattern args = 2;
         */
        this.args = [];
        /**
         * @generated from field: string prefix = 3;
         */
        this.prefix = '';
        /**
         * @generated from field: string fact = 4;
         */
        this.fact = '';
        /**
         * @generated from field: int32 num_shared = 5;
         */
        this.numShared = 0;
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Rule_Join().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Rule_Join().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Rule_Join().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Rule_Join, a, b);
    }
}
Rule_Join.runtime = proto3;
Rule_Join.typeName = 'Rule.Join';
Rule_Join.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'conclusion', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 2, name: 'args', kind: 'message', T: Rule_Join_JoinPattern, repeated: true },
    { no: 3, name: 'prefix', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 4, name: 'fact', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 5, name: 'num_shared', kind: 'scalar', T: 5 /* ScalarType.INT32 */ },
]);
/**
 * @generated from message Rule.Join.JoinPattern
 */
export class Rule_Join_JoinPattern extends Message {
    constructor(data) {
        super();
        /**
         * @generated from field: Rule.Join.JoinPattern.JoinLocation loc = 1;
         */
        this.loc = Rule_Join_JoinPattern_JoinLocation.Shared;
        /**
         * @generated from field: int32 var = 2;
         */
        this.var = 0;
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Rule_Join_JoinPattern().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Rule_Join_JoinPattern().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Rule_Join_JoinPattern().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Rule_Join_JoinPattern, a, b);
    }
}
Rule_Join_JoinPattern.runtime = proto3;
Rule_Join_JoinPattern.typeName = 'Rule.Join.JoinPattern';
Rule_Join_JoinPattern.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'loc', kind: 'enum', T: proto3.getEnumType(Rule_Join_JoinPattern_JoinLocation) },
    { no: 2, name: 'var', kind: 'scalar', T: 5 /* ScalarType.INT32 */ },
]);
/**
 * @generated from enum Rule.Join.JoinPattern.JoinLocation
 */
export var Rule_Join_JoinPattern_JoinLocation;
(function (Rule_Join_JoinPattern_JoinLocation) {
    /**
     * @generated from enum value: Shared = 0;
     */
    Rule_Join_JoinPattern_JoinLocation[Rule_Join_JoinPattern_JoinLocation["Shared"] = 0] = "Shared";
    /**
     * @generated from enum value: Prefix = 1;
     */
    Rule_Join_JoinPattern_JoinLocation[Rule_Join_JoinPattern_JoinLocation["Prefix"] = 1] = "Prefix";
    /**
     * @generated from enum value: FactArg = 2;
     */
    Rule_Join_JoinPattern_JoinLocation[Rule_Join_JoinPattern_JoinLocation["FactArg"] = 2] = "FactArg";
    /**
     * @generated from enum value: FactValue = 3;
     */
    Rule_Join_JoinPattern_JoinLocation[Rule_Join_JoinPattern_JoinLocation["FactValue"] = 3] = "FactValue";
})(Rule_Join_JoinPattern_JoinLocation || (Rule_Join_JoinPattern_JoinLocation = {}));
// Retrieve enum metadata with: proto3.getEnumType(Rule_Join_JoinPattern_JoinLocation)
proto3.util.setEnumType(Rule_Join_JoinPattern_JoinLocation, 'Rule.Join.JoinPattern.JoinLocation', [
    { no: 0, name: 'Shared' },
    { no: 1, name: 'Prefix' },
    { no: 2, name: 'FactArg' },
    { no: 3, name: 'FactValue' },
]);
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
export class Rule_Function extends Message {
    constructor(data) {
        super();
        /**
         * @generated from field: string conclusion = 1;
         */
        this.conclusion = '';
        /**
         * @generated from field: repeated int32 args = 2;
         */
        this.args = [];
        /**
         * @generated from field: string prefix = 3;
         */
        this.prefix = '';
        /**
         * @generated from oneof Rule.Function.type
         */
        this.type = { case: undefined };
        /**
         * @generated from field: repeated Pattern function_args = 6;
         */
        this.functionArgs = [];
        /**
         * @generated from field: int32 num_vars = 7;
         */
        this.numVars = 0;
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Rule_Function().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Rule_Function().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Rule_Function().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Rule_Function, a, b);
    }
}
Rule_Function.runtime = proto3;
Rule_Function.typeName = 'Rule.Function';
Rule_Function.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'conclusion', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 2, name: 'args', kind: 'scalar', T: 5 /* ScalarType.INT32 */, repeated: true },
    { no: 3, name: 'prefix', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    {
        no: 4,
        name: 'builtin',
        kind: 'enum',
        T: proto3.getEnumType(Rule_Function_Builtin),
        oneof: 'type',
    },
    { no: 5, name: 'other', kind: 'scalar', T: 9 /* ScalarType.STRING */, oneof: 'type' },
    { no: 6, name: 'function_args', kind: 'message', T: Pattern, repeated: true },
    { no: 7, name: 'num_vars', kind: 'scalar', T: 5 /* ScalarType.INT32 */ },
]);
/**
 * @generated from enum Rule.Function.Builtin
 */
export var Rule_Function_Builtin;
(function (Rule_Function_Builtin) {
    /**
     * @generated from enum value: BOOLEAN_TRUE = 0;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["BOOLEAN_TRUE"] = 0] = "BOOLEAN_TRUE";
    /**
     * @generated from enum value: BOOLEAN_FALSE = 1;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["BOOLEAN_FALSE"] = 1] = "BOOLEAN_FALSE";
    /**
     * @generated from enum value: NAT_ZERO = 2;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["NAT_ZERO"] = 2] = "NAT_ZERO";
    /**
     * @generated from enum value: NAT_SUCC = 3;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["NAT_SUCC"] = 3] = "NAT_SUCC";
    /**
     * @generated from enum value: INT_PLUS = 4;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["INT_PLUS"] = 4] = "INT_PLUS";
    /**
     * @generated from enum value: INT_MINUS = 5;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["INT_MINUS"] = 5] = "INT_MINUS";
    /**
     * @generated from enum value: INT_TIMES = 6;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["INT_TIMES"] = 6] = "INT_TIMES";
    /**
     * @generated from enum value: STRING_CONCAT = 7;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["STRING_CONCAT"] = 7] = "STRING_CONCAT";
    /**
     * @generated from enum value: EQUAL = 8;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["EQUAL"] = 8] = "EQUAL";
    /**
     * @generated from enum value: GT = 9;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["GT"] = 9] = "GT";
    /**
     * @generated from enum value: GEQ = 10;
     */
    Rule_Function_Builtin[Rule_Function_Builtin["GEQ"] = 10] = "GEQ";
})(Rule_Function_Builtin || (Rule_Function_Builtin = {}));
// Retrieve enum metadata with: proto3.getEnumType(Rule_Function_Builtin)
proto3.util.setEnumType(Rule_Function_Builtin, 'Rule.Function.Builtin', [
    { no: 0, name: 'BOOLEAN_TRUE' },
    { no: 1, name: 'BOOLEAN_FALSE' },
    { no: 2, name: 'NAT_ZERO' },
    { no: 3, name: 'NAT_SUCC' },
    { no: 4, name: 'INT_PLUS' },
    { no: 5, name: 'INT_MINUS' },
    { no: 6, name: 'INT_TIMES' },
    { no: 7, name: 'STRING_CONCAT' },
    { no: 8, name: 'EQUAL' },
    { no: 9, name: 'GT' },
    { no: 10, name: 'GEQ' },
]);
/**
 * @generated from message Program
 */
export class Program extends Message {
    constructor(data) {
        super();
        /**
         * @generated from field: repeated Rule rules = 1;
         */
        this.rules = [];
        /**
         * @generated from field: repeated string seeds = 2;
         */
        this.seeds = [];
        /**
         * @generated from field: repeated string forbids = 3;
         */
        this.forbids = [];
        /**
         * @generated from field: repeated string demands = 4;
         */
        this.demands = [];
        proto3.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new Program().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new Program().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new Program().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3.util.equals(Program, a, b);
    }
}
Program.runtime = proto3;
Program.typeName = 'Program';
Program.fields = proto3.util.newFieldList(() => [
    { no: 1, name: 'rules', kind: 'message', T: Rule, repeated: true },
    { no: 2, name: 'seeds', kind: 'scalar', T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 3, name: 'forbids', kind: 'scalar', T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 4, name: 'demands', kind: 'scalar', T: 9 /* ScalarType.STRING */, repeated: true },
]);
