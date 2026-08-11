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
import { BooleanExpression as BooleanExpr, Expression as Expr } from '../../../../lite/pipelines/pipelines';
export declare function and(expr1: Expr, expr2: Expr): BooleanExpr;
export declare function or(expr1: Expr, expr2: Expr): BooleanExpr;
export declare function not(expr: Expr): BooleanExpr;
export declare function xor(expr1: Expr, expr2: Expr): BooleanExpr;
