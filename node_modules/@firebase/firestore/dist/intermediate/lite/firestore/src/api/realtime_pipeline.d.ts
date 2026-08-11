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
import { Firestore } from '../lite-api/database';
import { BooleanExpression, Ordering } from '../lite-api/expressions';
import { Stage } from '../lite-api/stage';
import { UserDataReader, UserData } from '../lite-api/user_data_reader';
import { AbstractUserDataWriter } from '../lite-api/user_data_writer';
import { StructuredPipeline } from '../protos/firestore_proto_api';
import { JsonProtoSerializer } from '../remote/serializer';
/**
 * @beta
 * @internal
 *
 * The RealtimePipeline class provides a flexible and expressive framework for building complex data
 * transformation and query pipelines that can be used with Firestore's real-time and offline capabilities.
 *
 * A RealtimePipeline takes data sources, such as Firestore collections or collection groups, and applies
 * a series of stages that are chained together. Each stage takes the output from the previous stage
 * (or the data source) and produces an output for the next stage (or as the final output of the
 * pipeline).
 *
 * Expressions can be used within each stage to filter and transform data through the stage.
 *
 * NOTE: Both the initial and subsequent snapshots for RealtimePipeline take the consideration of the SDK's cache.
 * They might include results that have not been synchronized with the server yet, and wait for subsequent snapshots
 * to reflect the latest server state, this is the same as classic Firestore {@link Query}.
 * This behavior is different from the {@link Pipeline} class, which does not take the consideration of the SDK's cache.
 *
 * Usage Examples:
 *
 * ```typescript
 * const db: Firestore; // Assumes a valid firestore instance.
 *
 * // Example 1: Listen to books published after 1980
 * const unsubscribe = onRealtimePipelineSnapshot(db.realtimePipeline()
 *     .collection("books")
 *     .where(field("published").gt(1980)),
 *     (snapshot) => {
 *       // Handle the snapshot
 *     }
 * );
 * ```
 */
export declare class RealtimePipeline {
    /**
     * @internal
     * @private
     */
    _db: Firestore;
    /**
     * @internal
     * @private
     */
    readonly userDataReader: UserDataReader;
    /**
     * @internal
     * @private
     */
    _userDataWriter: AbstractUserDataWriter;
    readonly stages: Stage[];
    /**
     * @internal
     * @private
     * @param _db
     * @param userDataReader
     * @param _userDataWriter
     * @param _documentReferenceFactory
     * @param stages
     */
    constructor(
    /**
     * @internal
     * @private
     */
    _db: Firestore, 
    /**
     * @internal
     * @private
     */
    userDataReader: UserDataReader, 
    /**
     * @internal
     * @private
     */
    _userDataWriter: AbstractUserDataWriter, stages: Stage[]);
    /**
     * Reads user data for each expression in the expressionMap.
     * @param name Name of the calling function. Used for error messages when invalid user data is encountered.
     * @param expressionMap
     * @return the expressionMap argument.
     * @private
     * @internal
     */
    protected readUserData<T extends Map<string, UserData> | UserData[] | UserData>(name: string, expressionMap: T): T;
    where(condition: BooleanExpression): RealtimePipeline;
    limit(limit: number): RealtimePipeline;
    sort(...orderings: Ordering[]): RealtimePipeline;
    sort(options: {
        orderings: Ordering[];
    }): RealtimePipeline;
    /**
     * @internal
     * @private
     */
    _toStructuredPipeline(jsonProtoSerializer: JsonProtoSerializer): StructuredPipeline;
}
