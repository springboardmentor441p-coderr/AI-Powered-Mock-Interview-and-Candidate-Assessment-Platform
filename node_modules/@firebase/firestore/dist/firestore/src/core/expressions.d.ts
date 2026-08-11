import { Field, Constant, Expression, FunctionExpression, ListOfExprs, BooleanConstant, BooleanFunctionExpression, BooleanField } from '../lite-api/expressions';
import { Timestamp } from '../lite-api/timestamp';
import { MutableDocument } from '../model/document';
import { ArrayValue, Value } from '../protos/firestore_proto_api';
import { JsonProtoSerializer } from '../remote/serializer';
export type PipelineInputOutput = MutableDocument;
export interface EvaluationContext {
    serializer: JsonProtoSerializer;
    serverTimestampBehavior?: 'estimate' | 'previous' | 'none';
}
export type EvaluateResultType = 'ERROR' | 'UNSET' | 'NULL' | 'BOOLEAN' | 'INT' | 'DOUBLE' | 'TIMESTAMP' | 'STRING' | 'BYTES' | 'REFERENCE' | 'GEO_POINT' | 'ARRAY' | 'MAP' | 'FIELD_REFERENCE' | 'VECTOR';
export declare class EvaluateResult {
    readonly type: EvaluateResultType;
    readonly value?: Value | undefined;
    private constructor();
    static newError(): EvaluateResult;
    static newUnset(): EvaluateResult;
    static newNull(): EvaluateResult;
    static newValue(value: Value): EvaluateResult;
    isErrorOrUnset(): boolean;
    isNull(): boolean;
}
export declare function valueOrUndefined(value: EvaluateResult): Value | undefined;
export interface EvaluableExpr {
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
/**
 * @internal
 *
 * Unwraps a wrapped expression type, like BooleanExpression.
 *
 * @param expr The expression to unwrap.
 * @return The inner expression of a wrapped expression, otherwise
 * returns the input itself.
 */
export declare function unwrapExpression(expr: BooleanConstant): Constant;
export declare function unwrapExpression(expr: BooleanFunctionExpression): FunctionExpression;
export declare function unwrapExpression(expr: BooleanField): Field;
export declare function unwrapExpression(expr: Expression): Expression;
export declare function toEvaluable(expr: Expression): EvaluableExpr;
export declare class CoreField implements EvaluableExpr {
    private expr;
    constructor(expr: Field);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreConstant implements EvaluableExpr {
    private expr;
    constructor(expr: Constant);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreBooleanConstant implements EvaluableExpr {
    private expr;
    constructor(expr: BooleanConstant);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreListOfExprs implements EvaluableExpr {
    private expr;
    constructor(expr: ListOfExprs);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare const LongMaxValue: bigint;
export declare const LongMinValue: bigint;
declare abstract class BigIntOrDoubleArithmetics implements EvaluableExpr {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    abstract bigIntArith(left: {
        integerValue: number | string;
    }, right: {
        integerValue: number | string;
    }): bigint | number | undefined;
    abstract doubleArith(left: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }, right: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }): {
        doubleValue: number;
    } | undefined;
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
    applyArithmetics(left: EvaluateResult, right: EvaluateResult): EvaluateResult;
}
export declare class CoreAdd extends BigIntOrDoubleArithmetics {
    bigIntArith(left: {
        integerValue: number | string;
    }, right: {
        integerValue: number | string;
    }): bigint | undefined;
    doubleArith(left: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }, right: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }): {
        doubleValue: number;
    } | undefined;
}
export declare class CoreSubtract extends BigIntOrDoubleArithmetics {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    bigIntArith(left: {
        integerValue: number | string;
    }, right: {
        integerValue: number | string;
    }): bigint | undefined;
    doubleArith(left: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }, right: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }): {
        doubleValue: number;
    } | undefined;
}
export declare class CoreMultiply extends BigIntOrDoubleArithmetics {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    bigIntArith(left: {
        integerValue: number | string;
    }, right: {
        integerValue: number | string;
    }): bigint | undefined;
    doubleArith(left: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }, right: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }): {
        doubleValue: number;
    } | undefined;
}
export declare class CoreDivide extends BigIntOrDoubleArithmetics {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    bigIntArith(left: {
        integerValue: number | string;
    }, right: {
        integerValue: number | string;
    }): bigint | number | undefined;
    doubleArith(left: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }, right: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }): {
        doubleValue: number;
    } | undefined;
}
export declare class CoreMod extends BigIntOrDoubleArithmetics {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    bigIntArith(left: {
        integerValue: number | string;
    }, right: {
        integerValue: number | string;
    }): bigint | undefined;
    doubleArith(left: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }, right: {
        doubleValue: number | string;
    } | {
        integerValue: number | string;
    }): {
        doubleValue: number;
    } | undefined;
}
export declare class CoreAnd implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreNot implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreOr implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreXor implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
    static xor(a: boolean, b: boolean): boolean;
}
export declare class CoreEqAny implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreNotEqAny implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreIsNan implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreIsNotNan implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreIsNull implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreIsNotNull implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreIsError implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreExists implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreCond implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreLogicalMaximum implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreLogicalMinimum implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
declare abstract class ComparisonBase implements EvaluableExpr {
    protected expr: FunctionExpression;
    protected constructor(expr: FunctionExpression);
    abstract compareToResult(left: EvaluateResult, right: EvaluateResult): EvaluateResult;
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreEq extends ComparisonBase {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    compareToResult(left: EvaluateResult, right: EvaluateResult): EvaluateResult;
}
export declare class CoreNeq extends ComparisonBase {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    compareToResult(left: EvaluateResult, right: EvaluateResult): EvaluateResult;
}
export declare class CoreLt extends ComparisonBase {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    compareToResult(left: EvaluateResult, right: EvaluateResult): EvaluateResult;
}
export declare class CoreLte extends ComparisonBase {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    compareToResult(left: EvaluateResult, right: EvaluateResult): EvaluateResult;
}
export declare class CoreGt extends ComparisonBase {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    compareToResult(left: EvaluateResult, right: EvaluateResult): EvaluateResult;
}
export declare class CoreGte extends ComparisonBase {
    protected expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    compareToResult(left: EvaluateResult, right: EvaluateResult): EvaluateResult;
}
export declare class CoreArrayConcat implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreArrayReverse implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreArrayContains implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreArrayContainsAll implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreArrayContainsAny implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreArrayLength implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreArrayElement implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreReverse implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreReplaceFirst implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreReplaceAll implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreCharLength implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreByteLength implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
declare abstract class StringSearchFunctionBase implements EvaluableExpr {
    readonly expr: FunctionExpression;
    constructor(expr: FunctionExpression);
    abstract performSearch(value: string, search: string): EvaluateResult;
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreLike extends StringSearchFunctionBase {
    performSearch(value: string, search: string): EvaluateResult;
}
export declare class CoreRegexContains extends StringSearchFunctionBase {
    performSearch(value: string, search: string): EvaluateResult;
}
export declare class CoreRegexMatch extends StringSearchFunctionBase {
    performSearch(value: string, search: string): EvaluateResult;
}
export declare class CoreStrContains extends StringSearchFunctionBase {
    performSearch(value: string, search: string): EvaluateResult;
}
export declare class CoreStartsWith extends StringSearchFunctionBase {
    performSearch(value: string, search: string): EvaluateResult;
}
export declare class CoreEndsWith extends StringSearchFunctionBase {
    performSearch(value: string, search: string): EvaluateResult;
}
export declare class CoreToLower implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreToUpper implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreTrim implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreStrConcat implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreMapGet implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
declare abstract class DistanceBase implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    abstract calculateDistance(vec1: ArrayValue | undefined, vec2: ArrayValue | undefined): number | undefined;
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
export declare class CoreCosineDistance extends DistanceBase {
    calculateDistance(vec1: ArrayValue | undefined, vec2: ArrayValue | undefined): number | undefined;
}
export declare class CoreDotProduct extends DistanceBase {
    calculateDistance(vec1: ArrayValue | undefined, vec2: ArrayValue | undefined): number | undefined;
}
export declare class CoreEuclideanDistance extends DistanceBase {
    calculateDistance(vec1: ArrayValue | undefined, vec2: ArrayValue | undefined): number | undefined;
}
export declare class CoreVectorLength implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
}
declare abstract class UnixToTimestamp implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
    abstract toTimestamp(value: bigint): EvaluateResult;
}
export declare class CoreUnixMicrosToTimestamp extends UnixToTimestamp {
    toTimestamp(value: bigint): EvaluateResult;
}
export declare class CoreUnixMillisToTimestamp extends UnixToTimestamp {
    toTimestamp(value: bigint): EvaluateResult;
}
export declare class CoreUnixSecondsToTimestamp extends UnixToTimestamp {
    toTimestamp(value: bigint): EvaluateResult;
}
declare abstract class TimestampToUnix implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
    abstract toUnix(value: Timestamp): EvaluateResult;
}
export declare class CoreTimestampToUnixMicros extends TimestampToUnix {
    toUnix(timestamp: Timestamp): EvaluateResult;
}
export declare class CoreTimestampToUnixMillis extends TimestampToUnix {
    toUnix(timestamp: Timestamp): EvaluateResult;
}
export declare class CoreTimestampToUnixSeconds extends TimestampToUnix {
    toUnix(timestamp: Timestamp): EvaluateResult;
}
declare abstract class TimestampArithmetic implements EvaluableExpr {
    private expr;
    constructor(expr: FunctionExpression);
    evaluate(context: EvaluationContext, input: PipelineInputOutput): EvaluateResult;
    private getMultiplier;
    abstract newMicros(initialMicros: bigint, microsToOperation: bigint): bigint;
}
export declare class CoreTimestampAdd extends TimestampArithmetic {
    newMicros(initialMicros: bigint, microsToAdd: bigint): bigint;
}
export declare class CoreTimestampSub extends TimestampArithmetic {
    newMicros(initialMicros: bigint, microsToSub: bigint): bigint;
}
export {};
