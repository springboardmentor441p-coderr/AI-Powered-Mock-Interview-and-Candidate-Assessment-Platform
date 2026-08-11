/**
 * @license
 * Copyright 2024 Google LLC
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
import { RealtimePipeline } from '../api/realtime_pipeline';
import { Firestore } from '../lite-api/database';
import { Expression, BooleanExpression } from '../lite-api/expressions';
import { Pipeline as ApiPipeline } from '../lite-api/pipeline';
import { Stage } from '../lite-api/stage';
import { ResourcePath } from '../model/path';
import { ListenOptions } from './event_manager';
import { Filter as FilterInternal } from './filter';
import { CorePipeline } from './pipeline';
import { Query } from './query';
import { Target } from './target';
export declare function toPipelineBooleanExpr(f: FilterInternal): BooleanExpression;
export declare function toPipelineStages(query: Query, db: Firestore): Stage[];
export declare function canonifyExpr(expr: Expression): string;
export declare function canonifyPipeline(p: CorePipeline): string;
export declare function pipelineEq(left: CorePipeline, right: CorePipeline): boolean;
export type PipelineFlavor = 'exact' | 'augmented' | 'keyless';
export type PipelineSourceType = 'collection' | 'collection_group' | 'database' | 'documents';
export declare function asCollectionPipelineAtPath(pipeline: CorePipeline, path: ResourcePath): CorePipeline;
export type QueryOrPipeline = Query | CorePipeline;
export declare function isPipeline(q: QueryOrPipeline): q is CorePipeline;
export declare function stringifyQueryOrPipeline(q: QueryOrPipeline): string;
export declare function canonifyQueryOrPipeline(q: QueryOrPipeline): string;
export declare function queryOrPipelineEqual(left: QueryOrPipeline, right: QueryOrPipeline): boolean;
export type TargetOrPipeline = Target | CorePipeline;
export declare function canonifyTargetOrPipeline(q: TargetOrPipeline): string;
export declare function targetOrPipelineEqual(left: TargetOrPipeline, right: TargetOrPipeline): boolean;
export declare function pipelineHasRanges(pipeline: CorePipeline): boolean;
export declare function toCorePipeline(p: ApiPipeline | RealtimePipeline, listenOptions?: ListenOptions): CorePipeline;
