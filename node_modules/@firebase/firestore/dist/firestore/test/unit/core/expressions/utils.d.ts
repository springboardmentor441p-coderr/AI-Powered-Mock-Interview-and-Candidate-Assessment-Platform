/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { EvaluateResult } from '../../../../src/core/expressions';
import { BooleanExpression, Constant, Expression } from '../../../../src/lite-api/expressions';
export declare function constantInt(valueStr: string): Expression;
import { JsonObject, ObjectValue } from '../../../../src/model/object_value';
import { Value } from '../../../../src/protos/firestore_proto_api';
export declare const ERROR_VALUE: undefined;
export declare const UNSET_VALUE: import("../../../../src/lite-api/expressions").Field;
export declare const falseExpr: BooleanExpression;
export declare const trueExpr: BooleanExpression;
export declare function isTypeComparable(left: Constant, right: Constant): boolean;
export declare class ComparisonValueTestData {
    static BOOLEAN_VALUES: BooleanExpression[];
    static NUMERIC_VALUES: Expression[];
    static TIMESTAMP_VALUES: Expression[];
    static STRING_VALUES: Expression[];
    static BYTE_VALUES: Expression[];
    static ENTITY_REF_VALUES: Expression[];
    static GEO_VALUES: Expression[];
    static ARRAY_VALUES: Constant[];
    static VECTOR_VALUES: Expression[];
    static MAP_VALUES: Constant[];
    static ALL_SUPPORTED_COMPARABLE_VALUES: Expression[];
    static equivalentValues(): Array<{
        left: Expression;
        right: Expression;
    }>;
    static lessThanValues(): Array<{
        left: Expression;
        right: Expression;
    }>;
    static greaterThanValues(): Array<{
        left: Expression;
        right: Expression;
    }>;
    static mixedTypeValues(): Array<{
        left: Expression;
        right: Expression;
    }>;
}
export declare function evaluateToValue(expr: Expression, data?: JsonObject<unknown> | ObjectValue): Value;
export declare function evaluateToResult(expr: Expression, data?: JsonObject<unknown> | ObjectValue): EvaluateResult;
export declare function errorExpr(): Expression;
export declare function errorFilterCondition(): BooleanExpression;
export declare function expectEqualToConstant(evaluated: Value, expectedExpression: Expression, message?: string): Chai.Assertion;
