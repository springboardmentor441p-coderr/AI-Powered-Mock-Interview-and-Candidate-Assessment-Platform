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
import { Query, QuerySnapshot, DocumentData, CollectionReference, Unsubscribe, SnapshotListenOptions } from './firebase_export';
import { PersistenceMode } from './helpers';
import { RealtimePipeline, RealtimePipelineSnapshot } from './pipeline_export';
export type PipelineMode = 'no-pipeline-conversion' | 'query-to-pipeline';
type ApiPipelineSuiteFunction = (message: string, testSuite: (persistence: PersistenceMode, pipelineMode: PipelineMode) => void) => void;
interface ApiPipelineDescribe {
    (message: string, testSuite: (persistence: PersistenceMode, pipelineMode: PipelineMode) => void): void;
    skip: ApiPipelineSuiteFunction;
    only: ApiPipelineSuiteFunction;
}
export declare const apiPipelineDescribe: ApiPipelineDescribe;
export declare function checkOnlineAndOfflineResultsMatchWithPipelineMode(pipelineMode: PipelineMode, coll: CollectionReference, query: Query, ...expectedDocs: string[]): Promise<void>;
export declare function getDocs(pipelineMode: PipelineMode, queryOrPipeline: Query | RealtimePipeline): Promise<QuerySnapshot<DocumentData, DocumentData>> | Promise<RealtimePipelineSnapshot>;
export declare function onSnapshot(pipelineMode: PipelineMode, queryOrPipeline: Query | RealtimePipeline, observer: unknown): Unsubscribe;
export declare function onSnapshot(pipelineMode: PipelineMode, queryOrPipeline: Query | RealtimePipeline, options: unknown, observer: unknown): Unsubscribe;
export declare function toDataArray(docSet: QuerySnapshot | RealtimePipelineSnapshot): DocumentData[];
export declare function toChangesArray(docSet: QuerySnapshot | RealtimePipelineSnapshot, options?: SnapshotListenOptions): DocumentData[];
export declare class PipelineEventsAccumulator<T = RealtimePipelineSnapshot> {
    private events;
    private waitingFor;
    private deferred;
    private rejectAdditionalEvents;
    storeEvent: (evt: T) => void;
    awaitEvents(length: number): Promise<T[]>;
    awaitEvent(): Promise<T>;
    /** Waits for a latency compensated local snapshot. */
    awaitLocalEvent(): Promise<T>;
    /** Waits for multiple latency compensated local snapshot. */
    awaitLocalEvents(count: number): Promise<T[]>;
    /** Waits for a snapshot that has no pending writes */
    awaitRemoteEvent(): Promise<T>;
    assertNoAdditionalEvents(): Promise<void>;
    allowAdditionalEvents(): void;
    private checkFulfilled;
}
export {};
