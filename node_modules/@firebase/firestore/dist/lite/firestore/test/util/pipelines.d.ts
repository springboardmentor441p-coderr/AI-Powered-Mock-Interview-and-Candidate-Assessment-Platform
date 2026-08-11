/**
 * @license
 * Copyright 2026 Google LLC
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
import { RealtimePipeline } from '../../src/api/realtime_pipeline';
import { Unsubscribe, PipelineListenOptions } from '../../src/api/reference_impl';
import { RealtimePipelineSnapshot } from '../../src/api/snapshot';
import { PipelineInputOutput } from '../../src/core/pipeline_run';
import { Constant } from '../../src/lite-api/expressions';
import { Pipeline as LitePipeline } from '../../src/lite-api/pipeline';
import { Stage } from '../../src/lite-api/stage';
import { FirestoreError } from '../../src/util/error';
export declare function canonifyPipeline(p: LitePipeline): string;
export declare function pipelineEq(p1: LitePipeline, p2: LitePipeline): boolean;
export declare function runPipeline(p: LitePipeline, inputs: PipelineInputOutput[]): PipelineInputOutput[];
export declare function constantArray(...values: unknown[]): Constant;
export declare function constantMap(values: Record<string, unknown>): Constant;
export declare function pipelineFromStages(stages: Stage[]): RealtimePipeline;
export declare function onPipelineSnapshot(query: RealtimePipeline, observer: {
    next?: (snapshot: RealtimePipelineSnapshot) => void;
    error?: (error: FirestoreError) => void;
    complete?: () => void;
}): Unsubscribe;
export declare function onPipelineSnapshot(query: RealtimePipeline, options: PipelineListenOptions, observer: {
    next?: (snapshot: RealtimePipelineSnapshot) => void;
    error?: (error: FirestoreError) => void;
    complete?: () => void;
}): Unsubscribe;
export declare function onPipelineSnapshot(query: RealtimePipeline, onNext: (snapshot: RealtimePipelineSnapshot) => void, onError?: (error: FirestoreError) => void, onCompletion?: () => void): Unsubscribe;
export declare function onPipelineSnapshot(query: RealtimePipeline, options: PipelineListenOptions, onNext: (snapshot: RealtimePipelineSnapshot) => void, onError?: (error: FirestoreError) => void, onCompletion?: () => void): Unsubscribe;
export declare function _onRealtimePipelineSnapshot(pipeline: RealtimePipeline, observer: {
    next?: (snapshot: RealtimePipelineSnapshot) => void;
    error?: (error: FirestoreError) => void;
    complete?: () => void;
}): Unsubscribe;
export declare function _onRealtimePipelineSnapshot(pipeline: RealtimePipeline, options: PipelineListenOptions, observer: {
    next?: (snapshot: RealtimePipelineSnapshot) => void;
    error?: (error: FirestoreError) => void;
    complete?: () => void;
}): Unsubscribe;
export declare function _onRealtimePipelineSnapshot(pipeline: RealtimePipeline, onNext: (snapshot: RealtimePipelineSnapshot) => void, onError?: (error: FirestoreError) => void, onCompletion?: () => void): Unsubscribe;
export declare function _onRealtimePipelineSnapshot(pipeline: RealtimePipeline, options: PipelineListenOptions, onNext: (snapshot: RealtimePipelineSnapshot) => void, onError?: (error: FirestoreError) => void, onCompletion?: () => void): Unsubscribe;
