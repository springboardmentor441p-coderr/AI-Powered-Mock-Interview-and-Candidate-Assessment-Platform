'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var common = require('./common-D8YuAUTW.cjs.js');
require('@firebase/app');
require('@firebase/util');
require('@firebase/webchannel-wrapper/bloom-blob');
require('@firebase/logger');
require('@firebase/webchannel-wrapper/webchannel-blob');
require('re2js');

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
/**
 * @deprecated use selectablesToObject instead
 * @param selectables
 */ function __PRIVATE_selectablesToMap(a) {
    return new Map(Object.entries(__PRIVATE_selectablesToObject(a)));
}

function __PRIVATE_selectablesToObject(a) {
    const t = {};
    for (const n of a) {
        let a, i;
        if ("string" == typeof n ? (a = n, i = common.e(n)) : n instanceof common.o || n instanceof common.c ? (a = n.alias, 
        i = n.expr) : common.l(21273, {
            selectable: n
        }), void 0 !== t[a]) throw new common.s("invalid-argument", `Duplicate alias or field '${a}'`);
        t[a] = i;
    }
    return t;
}

/**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 * If the input is a string, it is assumed to be a field name, and a
 * field(value) is returned.
 *
 * @private
 * @internal
 * @param value
 */
function __PRIVATE_fieldOrExpression(s) {
    if (common.__PRIVATE_isString$1(s)) {
        return common.e(s);
    }
    /**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */
    return function __PRIVATE_valueToDefaultExpr(a) {
        let e;
        if (common.u(a)) return common.i(a);
        if (a instanceof common.t) return a;
        e = common.p(a) ? common.h(a) : a instanceof Array ? common.b(a) : 
        /**
 * Checks if a value is a Pipeline object.
 *
 * We use duck typing here to avoid a circular dependency between pipeline.ts and pipeline_util.ts.
 */
        function __PRIVATE_isPipeline$1(a) {
            return "object" == typeof a && null !== a && "function" == typeof a.toArrayExpression;
        }
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
        /**
 *
 * The Pipeline class provides a flexible and expressive framework for building complex data
 * transformation and query pipelines for Firestore.
 *
 * A pipeline takes data sources, such as Firestore collections or collection groups, and applies
 * a series of stages that are chained together. Each stage takes the output from the previous stage
 * (or the data source) and produces an output for the next stage (or as the final output of the
 * pipeline).
 *
 * Expressions can be used within each stage to filter and transform data through the stage.
 *
 * NOTE: The chained stages do not prescribe exactly how Firestore will execute the pipeline.
 * Instead, Firestore only guarantees that the result is the same as if the chained stages were
 * executed in order.
 *
 * @example
 * ```typescript
 * const db: Firestore; // Assumes a valid firestore instance.
 *
 * // Example 1: Select specific fields and rename 'rating' to 'bookRating'
 * const results1 = await execute(db.pipeline()
 *     .collection("books")
 *     .select("title", "author", field("rating").as("bookRating")));
 *
 * // Example 2: Filter documents where 'genre' is "Science Fiction" and 'published' is after 1950
 * const results2 = await execute(db.pipeline()
 *     .collection("books")
 *     .where(and(field("genre").equal("Science Fiction"), field("published").greaterThan(1950))));
 *
 * // Example 3: Calculate the average rating of books published after 1980
 * const results3 = await execute(db.pipeline()
 *     .collection("books")
 *     .where(field("published").greaterThan(1980))
 *     .aggregate(average(field("rating")).as("averageRating")));
 * ```
 */ (a) ? common.d(a) : common.m(a, void 0);
        return e;
    }(s);
}

let fa = class Pipeline {
    /**
     * @internal
     * @private
     * @param _db
     * @param userDataReader
     * @param _userDataWriter
     * @param stages
     */
    constructor(
    /**
     * @internal
     * @private
     */
    a, 
    /**
     * @internal
     * @private
     */
    e, 
    /**
     * @internal
     * @private
     */
    s, 
    /**
     * @internal
     * @private
     */
    t) {
        this._db = a, this.userDataReader = e, this._userDataWriter = s, this.stages = t;
    }
    _readUserData(a) {
        this.stages.forEach((e => {
            const s = a.contextWith({
                methodName: e._name
            });
            e._readUserData(s);
        }));
    }
    addFields(a, ...e) {
        // Process argument union(s) from method overloads
        let s, t;
        common.f(a) ? (s = [ a, ...e ], t = {}) : ({fields: s, ...t} = a);
        // Convert user land convenience types to internal types
                const n = __PRIVATE_selectablesToMap(s), i = new common.w(n, t);
        // Create stage object
                // Add stage to the pipeline
        return this._addStage(i);
    }
    removeFields(s, ...t) {
        // Process argument union(s) from method overloads
        const n = common.g(s) || common.__PRIVATE_isString$1(s) ? {} : s, i = (common.g(s) || common.__PRIVATE_isString$1(s) ? [ s, ...t ] : s.fields).map((s => common.__PRIVATE_isString$1(s) ? common.e(s) : s)), r = new common._(i, n);
        // Add stage to the pipeline
        return this._addStage(r);
    }
    define(a, ...e) {
        // Process argument union(s) from method overloads
        const s = common.T(a) ? {} : a, t = __PRIVATE_selectablesToMap(common.T(a) ? [ a, ...e ] : a.variables), n = new common.P(t, s);
        return this._addStage(n);
    }
    /**
     * Converts this Pipeline into an expression that evaluates to an array of results.
     *
     * <p>Result Unwrapping:</p>
     * <ul>
     *  <li>If the items have a single field, their values are unwrapped and returned directly in the array.</li>
     *  <li>If the items have multiple fields, they are returned as objects in the array</li>
     * </ul>
     *
     * @example
     * ```typescript
     * // Get a list of reviewers for each book
     * db.pipeline().collection("books")
     *     .define(field("id").as("book_id"))
     *     .addFields(
     *         db.pipeline().collection("reviews")
     *             .where(field("book_id").equal(variable("book_id")))
     *             .select(field("reviewer"))
     *             .toArrayExpression()
     *             .as("reviewers")
     *     )
     * ```
     *
     * Output:
     * ```json
     * [
     *   {
     *     "id": "1",
     *     "title": "1984",
     *     "reviewers": ["Alice", "Bob"]
     *   }
     * ]
     * ```
     *
     * Multiple Fields:
     * ```typescript
     * // Get a list of reviews (reviewer and rating) for each book
     * db.pipeline().collection("books")
     *     .define(field("id").as("book_id"))
     *     .addFields(
     *         db.pipeline().collection("reviews")
     *             .where(field("book_id").equal(variable("book_id")))
     *             .select(field("reviewer"), field("rating"))
     *             .toArrayExpression()
     *             .as("reviews"))
     * ```
     *
     * Output:
     * ```json
     * [
     *   {
     *     "id": "1",
     *     "title": "1984",
     *     "reviews": [
     *       { "reviewer": "Alice", "rating": 5 },
     *       { "reviewer": "Bob", "rating": 4 }
     *     ]
     *   }
     * ]
     * ```
     *
     * @returns An `Expression` representing the execution of this pipeline.
     */    toArrayExpression() {
        return new common.x("array", [ __PRIVATE_fieldOrExpression(this) ]);
    }
    /**
     * Converts this Pipeline into an expression that evaluates to a single scalar result.
     *
     * <p><b>Runtime Validation:</b> The runtime validates that the result set contains zero or one item. If
     * zero items, it evaluates to `null`.</p>
     *
     * <p>Result Unwrapping:</p>
     * <ul>
     *  <li>If the item has a single field, its value is unwrapped and returned directly.</li>
     *  <li>If the item has multiple fields, they are returned as an object.</li>
     * </ul>
     *
     * @example
     * ```typescript
     * // Calculate average rating for a restaurant
     * db.pipeline().collection("restaurants").addFields(
     *   db.pipeline().collection("reviews")
     *     .where(field("restaurant_id").equal(variable("rid")))
     *     .aggregate(average("rating").as("avg"))
     *     // Unwraps the single "avg" field to a scalar double
     *     .toScalarExpression().as("average_rating")
     * )
     * ```
     *
     * Output:
     * ```json
     * {
     *   "name": "The Burger Joint",
     *   "average_rating": 4.5
     * }
     * ```
     *
     * Multiple Fields:
     * ```typescript
     * // Calculate average rating AND count for a restaurant
     * db.pipeline().collection("restaurants").addFields(
     *   db.pipeline().collection("reviews")
     *     .where(field("restaurant_id").equal(variable("rid")))
     *     .aggregate(
     *       average("rating").as("avg"),
     *       count().as("count")
     *     )
     *     // Returns an object with "avg" and "count" fields
     *     .toScalarExpression().as("stats")
     * )
     * ```
     *
     * Output:
     * ```json
     * {
     *   "name": "The Burger Joint",
     *   "stats": {
     *     "avg": 4.5,
     *     "count": 100
     *   }
     * }
     * ```
     *
     * @returns An `Expression` representing the execution of this pipeline.
     */    toScalarExpression() {
        return new common.x("scalar", [ __PRIVATE_fieldOrExpression(this) ]);
    }
    select(e, ...s) {
        // Process argument union(s) from method overloads
        const t = common.f(e) || common.__PRIVATE_isString$1(e) ? {} : e, n = __PRIVATE_selectablesToMap(common.f(e) || common.__PRIVATE_isString$1(e) ? [ e, ...s ] : e.selections), i = new common.y(n, t);
        // Add stage to the pipeline
        return this._addStage(i);
    }
    where(a) {
        // Process argument union(s) from method overloads
        const e = common.E(a) ? {} : a, s = common.E(a) ? a : a.condition, t = new common.A(s, e);
        // Add stage to the pipeline
        return this._addStage(t);
    }
    offset(a) {
        // Process argument union(s) from method overloads
        let e, s;
        common.__PRIVATE_isNumber$1(a) ? (e = {}, s = a) : (e = a, s = a.offset);
        // Create stage object
                const t = new common.I(s, e);
        // Add stage to the pipeline
                return this._addStage(t);
    }
    limit(a) {
        // Process argument union(s) from method overloads
        const e = common.__PRIVATE_isNumber$1(a) ? {} : a, s = common.__PRIVATE_isNumber$1(a) ? a : a.limit, t = new common.v(s, e);
        // Add stage to the pipeline
        return this._addStage(t);
    }
    distinct(e, ...s) {
        // Process argument union(s) from method overloads
        const t = common.__PRIVATE_isString$1(e) || common.f(e) ? {} : e, n = __PRIVATE_selectablesToMap(common.__PRIVATE_isString$1(e) || common.f(e) ? [ e, ...s ] : e.groups), i = new common.M(n, t);
        // Add stage to the pipeline
        return this._addStage(i);
    }
    aggregate(a, ...e) {
        // Process argument union(s) from method overloads
        const t = common.O(a) ? {} : a, n = common.O(a) ? [ a, ...e ] : a.accumulators, i = common.O(a) ? [] : a.groups ?? [], r = function __PRIVATE_aliasedAggregateToMap(a) {
            return a.reduce(((a, e) => {
                if (void 0 !== a.get(e.alias)) throw new common.s("invalid-argument", `Duplicate alias or field '${e.alias}'`);
                return a.set(e.alias, e.aggregate), a;
            }), new Map);
        }
        /**
 * Converts a value to an Expression, Returning either a Constant, MapFunction,
 * ArrayFunction, or the input itself (if it's already an expression).
 *
 * @private
 * @internal
 * @param value
 */ (n), o = __PRIVATE_selectablesToMap(i), c = new common.V(o, r, t);
        // Add stage to the pipeline
        return this._addStage(c);
    }
    /**
     * Performs a vector proximity search on the documents from the previous stage, returning the
     * K-nearest documents based on the specified query `vectorValue` and `distanceMeasure`. The
     * returned documents will be sorted in order from nearest to furthest from the query `vectorValue`.
     *
     * @example
     * ```typescript
     * // Find the 10 most similar books based on the book description.
     * const bookDescription = "Lorem ipsum...";
     * const queryVector: number[] = ...; // compute embedding of `bookDescription`
     *
     * firestore.pipeline().collection("books")
     *     .findNearest({
     *       field: 'embedding',
     *       vectorValue: queryVector,
     *       distanceMeasure: 'euclidean',
     *       limit: 10,                        // optional
     *       distanceField: 'computedDistance' // optional
     *     });
     * ```
     *
     * @param options - An object that specifies required and optional parameters for the stage.
     * @returns A new {@link @firebase/firestore/pipelines#Pipeline} object with this stage appended to the stage list.
     */    findNearest(a) {
        // Convert user land convenience types to internal types
        const e = common.S(a.field), s = function __PRIVATE_vectorToExpr(a) {
            if (a instanceof common.t) return a;
            if (a instanceof common.n) return common.i(a);
            if (Array.isArray(a)) return common.i(common.r(a));
            throw new Error("Unsupported value: " + typeof a);
        }(a.vectorValue), o = {
            distanceField: a.distanceField ? common.S(a.distanceField) : void 0,
            limit: a.limit,
            rawOptions: a.rawOptions
        }, c = new common.D(s, e, a.distanceMeasure, o);
        // Add stage to the pipeline
        return this._addStage(c);
    }
    // TODO(search) link to external documentation citing list of supported
    // expressions, when that documentation is created. List is not maintained
    // in the SDK because the list will change as the backend enables support.
    /**
     * Add a search stage to the Pipeline. The search stage supports
     * full-text search and geo search expressions.
     *
     * @remarks
     * This must be the first stage of the pipeline. A limited set of expressions are supported in the search stage.
     *
     * @example
     * ```typescript
     * // Full-text search example
     * firestore.pipeline().collection("restaurants")
     * .search({
     *   query: documentMatches("waffles OR pancakes"),
     *   sort: [
     *     score().descending(),
     *   ],
     *   addFields: [
     *     score().as("searchScore"),
     *   ]
     * })
     * ```
     *
     * @example
     * ```typescript
     * // Geo distance search example
     * const queryLocation = new GeoPoint(0, 0);
     * db.pipeline().collection('restaurants').search({
     *   query: field('location').geoDistance(queryLocation).lessThanOrEqual(1000),
     *   sort: [
     *     score().descending(),
     *   ],
     * })
     * ```
     *
     * @param options - An object that specifies parameters for the stage.
     * @return A new `Pipeline` object with this stage appended to the stage list.
     * @beta
     */
    search(a) {
        // Convert user land convenience types to internal types
        const e = a.addFields ? __PRIVATE_selectablesToObject(a.addFields) : void 0, s = common.j(a.query) ? a.query : common.q(a.query), t = common.F(a.sort) ? [ a.sort ] : a.sort, n = {
            ...a,
            addFields: e,
            select: undefined,
            query: s,
            sort: t
        }, i = new common.C(n);
        // Add stage to the pipeline
        return this._addStage(i);
    }
    sort(a, ...e) {
        // Process argument union(s) from method overloads
        const s = common.F(a) ? {} : a, t = common.F(a) ? [ a, ...e ] : a.orderings, n = new common.L(t, s);
        // Add stage to the pipeline
        return this._addStage(n);
    }
    replaceWith(e) {
        // Process argument union(s) from method overloads
        const s = common.__PRIVATE_isString$1(e) || common.j(e) ? {} : e, t = __PRIVATE_fieldOrExpression(common.__PRIVATE_isString$1(e) || common.j(e) ? e : e.map), n = new common.$(t, s);
        // Add stage to the pipeline
        return this._addStage(n);
    }
    sample(a) {
        // Process argument union(s) from method overloads
        const e = common.__PRIVATE_isNumber$1(a) ? {} : a;
        let s, t;
        common.__PRIVATE_isNumber$1(a) ? (s = a, t = "documents") : common.__PRIVATE_isNumber$1(a.documents) ? (s = a.documents, t = "documents") : (s = a.percentage, 
        t = "percent");
        // Create stage object
                const n = new common.N(s, t, e);
        // Add stage to the pipeline
                return this._addStage(n);
    }
    union(a) {
        // Process argument union(s) from method overloads
        let e, s;
        !function __PRIVATE_isPipeline(a) {
            return a instanceof fa;
        }
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
        /**
 * Provides the entry point for defining the data source of a Firestore {@link @firebase/firestore/pipelines#Pipeline}.
 *
 * Use the methods of this class (e.g., {@link @firebase/firestore/pipelines#PipelineSource.(collection:1)}, {@link @firebase/firestore/pipelines#PipelineSource.(collectionGroup:1)},
 * {@link @firebase/firestore/pipelines#PipelineSource.(database:1)}, or {@link @firebase/firestore/pipelines#PipelineSource.(documents:1)}) to specify the initial data
 * for your pipeline, such as a collection, a collection group, the entire database, or a set of specific documents.
 */ (a) ? ({other: s, ...e} = a) : (e = {}, s = a);
        // Create stage object
                const t = new common.U(s, e);
        // Add stage to the pipeline
                return this._addStage(t);
    }
    unnest(e, s) {
        // Process argument union(s) from method overloads
        let t, n, i;
        common.f(e) ? (t = {}, n = e, i = s) : ({selectable: n, indexField: i, ...t} = e);
        // Convert user land convenience types to internal types
                const r = n.alias, o = n.expr;
        common.__PRIVATE_isString$1(i) && (t.indexField = common.G(i, "unnest"));
        // Create stage object
                const c = new common.W(r, o, t);
        // Add stage to the pipeline
                return this._addStage(c);
    }
    /**
     * Adds a raw stage to the pipeline.
     *
     * <p>This method provides a flexible way to extend the pipeline's functionality by adding custom
     * stages. Each raw stage is defined by a unique `name` and a set of `params` that control its
     * behavior.
     *
     * <p>Example (Assuming there is no 'where' stage available in SDK):
     *
     * @example
     * ```typescript
     * // Assume we don't have a built-in 'where' stage
     * firestore.pipeline().collection('books')
     *     .rawStage('where', [field('published').lessThan(1900)]) // Custom 'where' stage
     *     .select('title', 'author');
     * ```
     *
     * @param name - The unique name of the raw stage to add.
     * @param params - A list of parameters to configure the raw stage's behavior.
     * @param options - An object of key value pairs that specifies optional parameters for the stage.
     * @returns A new {@link @firebase/firestore/pipelines#Pipeline} object with this stage appended to the stage list.
     */    rawStage(a, e, s) {
        // Convert user land convenience types to internal types
        const n = e.map((a => a instanceof common.t || a instanceof common.k ? a : common.p(a) ? common.B(a) : common.m(a, "rawStage"))), i = new common.K(a, n, s ?? {});
        // Create stage object
                // Add stage to the pipeline
        return this._addStage(i);
    }
    /**
     * @internal
     * @private
     */    _toProto(a) {
        return {
            stages: this.stages.map((e => e._toProto(a)))
        };
    }
    _addStage(a) {
        const e = this.stages.map((a => a));
        return e.push(a), this.newPipeline(this._db, e);
    }
    /**
     * @internal
     * @private
     * @param db
     * @param userDataReader
     * @param userDataWriter
     * @param stages
     * @protected
     */    newPipeline(a, e) {
        return new Pipeline(a, this.userDataReader, this._userDataWriter, e);
    }
};

class PipelineSource {
    /**
     * @internal
     * @private
     * @param databaseId
     * @param userDataReader
     * @param _createPipeline
     */
    constructor(a, e, 
    /**
     * @internal
     * @private
     */
    s) {
        this.databaseId = a, this.userDataReader = e, this._createPipeline = s;
    }
    collection(e) {
        // Process argument union(s) from method overloads
        const s = common.__PRIVATE_isString$1(e) || common.z(e) ? {} : e, t = common.__PRIVATE_isString$1(e) || common.z(e) ? e : e.collection;
        // Validate that a user provided reference is for the same Firestore DB
        common.z(t) && this._validateReference(t);
        // Convert user land convenience types to internal types
                const n = common.__PRIVATE_isString$1(t) ? t : t.path, i = new common.H(n, s), r = this.userDataReader.createContext(3 /* UserDataSource.Argument */ , "collection");
        // Create stage object
                // Add stage to the pipeline
        return i._readUserData(r), this._createPipeline([ i ]);
    }
    collectionGroup(e) {
        // Process argument union(s) from method overloads
        let s, t;
        common.__PRIVATE_isString$1(e) ? (s = e, t = {}) : ({collectionId: s, ...t} = e);
        // Create stage object
                const n = new common.J(s, t), i = this.userDataReader.createContext(3 /* UserDataSource.Argument */ , "collectionGroup");
        // User data must be read in the context of the API method to
        // provide contextual errors
                // Add stage to the pipeline
        return n._readUserData(i), this._createPipeline([ n ]);
    }
    database(a) {
        // Create stage object
        const e = new common.Q(
        // Process argument union(s) from method overloads
        a = a ?? {}), s = this.userDataReader.createContext(3 /* UserDataSource.Argument */ , "database");
        // User data must be read in the context of the API method to
        // provide contextual errors
                // Add stage to the pipeline
        return e._readUserData(s), this._createPipeline([ e ]);
    }
    documents(e) {
        // Process argument union(s) from method overloads
        let s, t;
        Array.isArray(e) ? (t = e, s = {}) : ({docs: t, ...s} = e), 
        // Validate that all user provided references are for the same Firestore DB
        t.filter((a => a instanceof common.X)).forEach((a => this._validateReference(a)));
        // Convert user land convenience types to internal types
        const n = t.map((e => common.__PRIVATE_isString$1(e) ? e : e.path)), i = new common.Y(n, s), r = this.userDataReader.createContext(3 /* UserDataSource.Argument */ , "documents");
        // Create stage object
                // Add stage to the pipeline
        return i._readUserData(r), this._createPipeline([ i ]);
    }
    /**
     * Convert the given Query into an equivalent Pipeline.
     *
     * @param query - A Query to be converted into a Pipeline.
     *
     * @throws `FirestoreError` Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
     */    createFrom(a) {
        return this._createPipeline(common.Z(a._query, a.firestore));
    }
    _validateReference(a) {
        const e = a.firestore._databaseId;
        if (!e.isEqual(this.databaseId)) throw new common.s(common.aa.INVALID_ARGUMENT, `Invalid ${a instanceof common.ea ? "CollectionReference" : "DocumentReference"}. The project ID ("${e.projectId}") or the database ("${e.database}") does not match the project ID ("${this.databaseId.projectId}") and database ("${this.databaseId.database}") of the target database of this Pipeline.`);
    }
}

function subcollection(e) {
    // Process argument union(s) from method overloads
    let s, t;
    common.__PRIVATE_isString$1(e) ? (s = e, t = {}) : ({path: s, ...t} = e);
    // Create stage object
        const n = new common.sa(s, t);
    return new fa(void 0, void 0, void 0, [ n ]);
}

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
/**
 * Represents the results of a Firestore pipeline execution.
 *
 * A `PipelineSnapshot` contains zero or more {@link @firebase/firestore/pipelines#PipelineResult} objects
 * representing the documents returned by a pipeline query. It provides methods
 * to iterate over the documents and access metadata about the query results.
 *
 * @example
 * ```typescript
 * const snapshot: PipelineSnapshot = await firestore
 *   .pipeline()
 *   .collection('myCollection')
 *   .where(field('value').greaterThan(10))
 *   .execute();
 *
 * snapshot.results.forEach(doc => {
 *   console.log(doc.id, '=>', doc.data());
 * });
 * ```
 */ class PipelineSnapshot {
    constructor(a, e, s) {
        this._pipeline = a, this._executionTime = s, this._results = e;
    }
    /**
     * An array of all the results in the `PipelineSnapshot`.
     */    get results() {
        return this._results;
    }
    /**
     * The time at which the pipeline producing this result is executed.
     *
     * @readonly
     *
     */    get executionTime() {
        if (void 0 === this._executionTime) throw new Error("'executionTime' is expected to exist, but it is undefined");
        return this._executionTime;
    }
}

/**
 *
 * A PipelineResult contains data read from a Firestore Pipeline. The data can be extracted with the
 * {@link @firebase/firestore/pipelines#PipelineResult.data} or {@link @firebase/firestore/pipelines#PipelineResult.(get:1)} methods.
 *
 * <p>If the PipelineResult represents a non-document result, `ref` will return a undefined
 * value.
 */ class PipelineResult {
    /**
     * @private
     * @internal
     *
     * @param userDataWriter - The serializer used to encode/decode protobuf.
     * @param fields - The fields of the Firestore `Document` Protobuf backing
     * this document.
     * @param ref - The reference to the document.
     * @param createTime - The time when the document was created if the result is a document, undefined otherwise.
     * @param updateTime - The time when the document was last updated if the result is a document, undefined otherwise.
     * @param metadata
     * @param listenOptions
     */
    constructor(a, e, s, t, n, i, r) {
        this._ref = s, this._userDataWriter = a, this._createTime = t, this._updateTime = n, 
        this._fields = e, this._metadata = i, this._listenOptions = r;
    }
    /**
     * @private
     * @internal
     * @param userDataWriter
     * @param doc
     * @param ref
     * @param metadata
     * @param listenOptions
     */    static fromDocument(a, e, s, t, n) {
        return new PipelineResult(a, e.data, s, e.createTime.toTimestamp(), e.version.toTimestamp(), t, n);
    }
    /**
     * The reference of the document, if it is a document; otherwise `undefined`.
     */    get ref() {
        return this._ref;
    }
    /**
     * The ID of the document for which this PipelineResult contains data, if it is a document; otherwise `undefined`.
     *
     * @readonly
     *
     */    get id() {
        return this._ref?.id;
    }
    /**
     * The time the document was created. Undefined if this result is not a document.
     *
     * @readonly
     */    get createTime() {
        return this._createTime;
    }
    /**
     * The time the document was last updated (at the time the snapshot was
     * generated). Undefined if this result is not a document.
     *
     * @readonly
     */    get updateTime() {
        return this._updateTime;
    }
    /**
     * Retrieves all fields in the result as an object.
     *
     * @returns An object containing all fields in the document or
     * 'undefined' if the document doesn't exist.
     *
     * @example
     * ```
     * let p = firestore.pipeline().collection('col');
     *
     * p.execute().then(results => {
     *   let data = results[0].data();
     *   console.log(`Retrieved data: ${JSON.stringify(data)}`);
     * });
     * ```
     */    data() {
        return this._userDataWriter.convertValue(this._fields.value, this._listenOptions?.serverTimestampBehavior);
    }
    /**
     * @internal
     * @private
     *
     * Retrieves all fields in the result as a proto value.
     *
     * @returns An `Object` containing all fields in the result.
     */    _fieldsProto() {
        // Return a cloned value to prevent manipulation of the Snapshot's data
        return this._fields.clone().value.mapValue.fields;
    }
    /**
     * Retrieves the field specified by `field`.
     *
     * @param field - The field path
     * (e.g. 'foo' or 'foo.bar') to a specific field.
     * @returns The data at the specified field location or `undefined` if no
     * such field exists.
     *
     * @example
     * ```
     * let p = firestore.pipeline().collection('col');
     *
     * p.execute().then(results => {
     *   let field = results[0].get('a.b');
     *   console.log(`Retrieved field value: ${field}`);
     * });
     * ```
     */
    // We deliberately use `any` in the external API to not impose type-checking
    // on end users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(a) {
        if (void 0 === this._fields) return;
        common.g(a) && (a = a.fieldName);
        const e = this._fields.field(common.ta("DocumentSnapshot.get", a));
        return null !== e ? this._userDataWriter.convertValue(e, this._listenOptions?.serverTimestampBehavior) : void 0;
    }
}

/**
 * Test equality of two PipelineResults.
 * @param left - First PipelineResult to compare.
 * @param right - Second PipelineResult to compare.
 */ function pipelineResultEqual(a, e) {
    return a === e || common.na(a._ref, e._ref, common.ia) && common.na(a._fields, e._fields, ((a, e) => a.isEqual(e)));
}

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
 */ class Pipeline extends fa {
    /**
     * @internal
     * @private
     * @param db
     * @param userDataReader
     * @param userDataWriter
     * @param stages
     * @param converter
     * @protected
     */
    newPipeline(a, e) {
        return new Pipeline(a, this.userDataReader, this._userDataWriter, e);
    }
}

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
 */ function execute(a) {
    const e = a instanceof fa ? {
        pipeline: a
    } : a, {pipeline: t, rawOptions: n, ...i} = e;
    if (!t._db) return Promise.reject(new common.s(common.aa.FAILED_PRECONDITION, "This pipeline was created without a database (e.g., as a subcollection pipeline) and cannot be executed directly. It can only be used as part of another pipeline."));
    const r = common.ra(t._db, common.da), o = common.oa(r), c = common.la(r).createContext(3 /* UserDataSource.Argument */ , "execute");
    t._readUserData(c);
    const l = new common.ua(r), u = new common.pa(i, n);
    u._readUserData(c);
    const p = new common.ma(t, u);
    return common.ha(o, p).then((a => {
        // Get the execution time from the first result.
        // firestoreClientExecutePipeline returns at least one PipelineStreamElement
        // even if the returned document set is empty.
        const e = a.length > 0 ? a[0].executionTime?.toTimestamp() : void 0, s = a.filter((a => !!a.fields)).map((a => new PipelineResult(l, a.fields, a.key?.path ? new common.X(r, null, a.key) : void 0, a.createTime?.toTimestamp(), a.updateTime?.toTimestamp())));
        return new PipelineSnapshot(t, s, e);
    }));
}

/**
 * @beta
 * Creates and returns a new PipelineSource, which allows specifying the source stage of a {@link @firebase/firestore/pipelines#Pipeline}.
 *
 * @example
 * ```typescript
 * let myPipeline: Pipeline = firestore.pipeline().collection('books');
 * ```
 */
// Augment the Firestore class with the pipeline() factory method
common.da.prototype.pipeline = function() {
    const a = common.la(this);
    return new PipelineSource(this._databaseId, a, (e => new Pipeline(this, a, new common.ua(this), e)));
};

exports.AggregateFunction = common.k;
exports.AliasedAggregate = common.AliasedAggregate;
exports.AliasedExpression = common.c;
exports.BooleanExpression = common.BooleanExpression;
exports.Expression = common.t;
exports.Field = common.o;
exports.FunctionExpression = common.x;
exports.Ordering = common.Ordering;
exports._internalPipelineToExecutePipelineRequestProto = common._internalPipelineToExecutePipelineRequestProto;
exports.abs = common.abs;
exports.add = common.add;
exports.and = common.and;
exports.array = common.b;
exports.arrayAgg = common.arrayAgg;
exports.arrayAggDistinct = common.arrayAggDistinct;
exports.arrayConcat = common.arrayConcat;
exports.arrayContains = common.arrayContains;
exports.arrayContainsAll = common.arrayContainsAll;
exports.arrayContainsAny = common.arrayContainsAny;
exports.arrayFilter = common.arrayFilter;
exports.arrayFirst = common.arrayFirst;
exports.arrayFirstN = common.arrayFirstN;
exports.arrayGet = common.arrayGet;
exports.arrayIndexOf = common.arrayIndexOf;
exports.arrayIndexOfAll = common.arrayIndexOfAll;
exports.arrayLast = common.arrayLast;
exports.arrayLastIndexOf = common.arrayLastIndexOf;
exports.arrayLastN = common.arrayLastN;
exports.arrayLength = common.arrayLength;
exports.arrayMaximum = common.arrayMaximum;
exports.arrayMaximumN = common.arrayMaximumN;
exports.arrayMinimum = common.arrayMinimum;
exports.arrayMinimumN = common.arrayMinimumN;
exports.arraySlice = common.arraySlice;
exports.arraySum = common.arraySum;
exports.arrayTransform = common.arrayTransform;
exports.arrayTransformWithIndex = common.arrayTransformWithIndex;
exports.ascending = common.ascending;
exports.average = common.average;
exports.byteLength = common.byteLength;
exports.ceil = common.ceil;
exports.charLength = common.charLength;
exports.coalesce = common.coalesce;
exports.collectionId = common.collectionId;
exports.concat = common.concat;
exports.conditional = common.conditional;
exports.constant = common.i;
exports.cosineDistance = common.cosineDistance;
exports.count = common.count;
exports.countAll = common.countAll;
exports.countDistinct = common.countDistinct;
exports.countIf = common.countIf;
exports.currentDocument = common.currentDocument;
exports.currentTimestamp = common.currentTimestamp;
exports.descending = common.descending;
exports.divide = common.divide;
exports.documentId = common.documentId;
exports.documentMatches = common.q;
exports.dotProduct = common.dotProduct;
exports.endsWith = common.endsWith;
exports.equal = common.equal;
exports.equalAny = common.equalAny;
exports.euclideanDistance = common.euclideanDistance;
exports.exists = common.exists;
exports.exp = common.exp;
exports.field = common.e;
exports.first = common.first;
exports.floor = common.floor;
exports.geoDistance = common.geoDistance;
exports.greaterThan = common.greaterThan;
exports.greaterThanOrEqual = common.greaterThanOrEqual;
exports.ifAbsent = common.ifAbsent;
exports.ifError = common.ifError;
exports.ifNull = common.ifNull;
exports.isAbsent = common.isAbsent;
exports.isError = common.isError;
exports.isType = common.isType;
exports.join = common.join;
exports.last = common.last;
exports.length = common.length;
exports.lessThan = common.lessThan;
exports.lessThanOrEqual = common.lessThanOrEqual;
exports.like = common.like;
exports.ln = common.ln;
exports.log = common.log;
exports.log10 = common.log10;
exports.logicalMaximum = common.logicalMaximum;
exports.logicalMinimum = common.logicalMinimum;
exports.ltrim = common.ltrim;
exports.map = common.h;
exports.mapEntries = common.mapEntries;
exports.mapGet = common.mapGet;
exports.mapKeys = common.mapKeys;
exports.mapMerge = common.mapMerge;
exports.mapRemove = common.mapRemove;
exports.mapSet = common.mapSet;
exports.mapValues = common.mapValues;
exports.maximum = common.maximum;
exports.minimum = common.minimum;
exports.mod = common.mod;
exports.multiply = common.multiply;
exports.nor = common.nor;
exports.not = common.not;
exports.notEqual = common.notEqual;
exports.notEqualAny = common.notEqualAny;
exports.or = common.or;
exports.parent = common.parent;
exports.pow = common.pow;
exports.rand = common.rand;
exports.regexContains = common.regexContains;
exports.regexFind = common.regexFind;
exports.regexFindAll = common.regexFindAll;
exports.regexMatch = common.regexMatch;
exports.reverse = common.reverse;
exports.round = common.round;
exports.rtrim = common.rtrim;
exports.score = common.score;
exports.split = common.split;
exports.sqrt = common.sqrt;
exports.startsWith = common.startsWith;
exports.stringConcat = common.stringConcat;
exports.stringContains = common.stringContains;
exports.stringIndexOf = common.stringIndexOf;
exports.stringRepeat = common.stringRepeat;
exports.stringReplaceAll = common.stringReplaceAll;
exports.stringReplaceOne = common.stringReplaceOne;
exports.stringReverse = common.stringReverse;
exports.substring = common.substring;
exports.subtract = common.subtract;
exports.sum = common.sum;
exports.switchOn = common.switchOn;
exports.timestampAdd = common.timestampAdd;
exports.timestampDiff = common.timestampDiff;
exports.timestampExtract = common.timestampExtract;
exports.timestampSubtract = common.timestampSubtract;
exports.timestampToUnixMicros = common.timestampToUnixMicros;
exports.timestampToUnixMillis = common.timestampToUnixMillis;
exports.timestampToUnixSeconds = common.timestampToUnixSeconds;
exports.timestampTruncate = common.timestampTruncate;
exports.toLower = common.toLower;
exports.toUpper = common.toUpper;
exports.trim = common.trim;
exports.trunc = common.trunc;
exports.type = common.type;
exports.unixMicrosToTimestamp = common.unixMicrosToTimestamp;
exports.unixMillisToTimestamp = common.unixMillisToTimestamp;
exports.unixSecondsToTimestamp = common.unixSecondsToTimestamp;
exports.variable = common.variable;
exports.vectorLength = common.vectorLength;
exports.xor = common.xor;
exports.Pipeline = Pipeline;
exports.PipelineResult = PipelineResult;
exports.PipelineSnapshot = PipelineSnapshot;
exports.PipelineSource = PipelineSource;
exports.execute = execute;
exports.pipelineResultEqual = pipelineResultEqual;
exports.subcollection = subcollection;
//# sourceMappingURL=pipelines.cjs.js.map
