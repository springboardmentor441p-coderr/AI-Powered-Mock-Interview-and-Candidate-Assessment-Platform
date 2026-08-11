import { d as da, l as la, u as ua, b9 as __PRIVATE_isString$1, ba as z, bb as H, bc as J, bd as Q, X, be as Y, bf as Z, s, c as aa, ay as ea, bg as f, bh as w, bi as g, bj as e, bk as _, bl as T, bm as P, bn as x, bo as y, bp as E, bq as A, br as __PRIVATE_isNumber$1, bs as I, bt as v, bu as M, bv as O, bw as V, bx as S, by as t, aD as n, bz as i, b7 as r, bA as D, bB as j, bC as q, bD as F, bE as C, bF as L, bG as $, bH as N, bI as U, bJ as G, bK as W, bL as k, bM as p, bN as B, bO as m, bP as K, bQ as u, bR as h, bS as b, bT as d, bU as o, bV as c, am as l, t as ta, z as ra, D as oa, bW as pa, bX as ha, bY as na, bZ as sa, b3 as ia, b_ as ma } from './common-DugxmK6F.esm.js';
export { b$ as AliasedAggregate, c0 as BooleanExpression, c1 as Ordering, c2 as _internalPipelineToExecutePipelineRequestProto, c3 as abs, c4 as add, c5 as and, c6 as arrayAgg, c7 as arrayAggDistinct, c8 as arrayConcat, c9 as arrayContains, ca as arrayContainsAll, cb as arrayContainsAny, cc as arrayFilter, cd as arrayFirst, ce as arrayFirstN, cf as arrayGet, cg as arrayIndexOf, ch as arrayIndexOfAll, ci as arrayLast, cj as arrayLastIndexOf, ck as arrayLastN, cl as arrayLength, cm as arrayMaximum, cn as arrayMaximumN, co as arrayMinimum, cp as arrayMinimumN, cq as arraySlice, cr as arraySum, cs as arrayTransform, ct as arrayTransformWithIndex, cu as ascending, cv as average, cw as byteLength, cx as ceil, cy as charLength, cz as coalesce, cA as collectionId, cB as concat, cC as conditional, cD as cosineDistance, cE as count, cF as countAll, cG as countDistinct, cH as countIf, cI as currentDocument, cJ as currentTimestamp, cK as descending, cL as divide, cM as documentId, cN as dotProduct, cO as endsWith, cP as equal, cQ as equalAny, cR as euclideanDistance, cS as exists, cT as exp, cU as first, cV as floor, cW as geoDistance, cX as greaterThan, cY as greaterThanOrEqual, cZ as ifAbsent, c_ as ifError, c$ as ifNull, d0 as isAbsent, d1 as isError, d2 as isType, d3 as join, d4 as last, d5 as length, d6 as lessThan, d7 as lessThanOrEqual, d8 as like, d9 as ln, da as log, db as log10, dc as logicalMaximum, dd as logicalMinimum, de as ltrim, df as mapEntries, dg as mapGet, dh as mapKeys, di as mapMerge, dj as mapRemove, dk as mapSet, dl as mapValues, dm as maximum, dn as minimum, dp as mod, dq as multiply, dr as nor, ds as not, dt as notEqual, du as notEqualAny, dv as or, dw as parent, dx as pow, dy as rand, dz as regexContains, dA as regexFind, dB as regexFindAll, dC as regexMatch, dD as reverse, dE as round, dF as rtrim, dG as score, dH as split, dI as sqrt, dJ as startsWith, dK as stringConcat, dL as stringContains, dM as stringIndexOf, dN as stringRepeat, dO as stringReplaceAll, dP as stringReplaceOne, dQ as stringReverse, dR as substring, dS as subtract, dT as sum, dU as switchOn, dV as timestampAdd, dW as timestampDiff, dX as timestampExtract, dY as timestampSubtract, dZ as timestampToUnixMicros, d_ as timestampToUnixMillis, d$ as timestampToUnixSeconds, e0 as timestampTruncate, e1 as toLower, e2 as toUpper, e3 as trim, e4 as trunc, e5 as type, e6 as unixMicrosToTimestamp, e7 as unixMillisToTimestamp, e8 as unixSecondsToTimestamp, e9 as variable, ea as vectorLength, eb as xor } from './common-DugxmK6F.esm.js';
import '@firebase/app';
import '@firebase/util';
import '@firebase/webchannel-wrapper/bloom-blob';
import '@firebase/logger';
import '@firebase/webchannel-wrapper/webchannel-blob';
import 're2js';

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
        if ("string" == typeof n ? (a = n, i = e(n)) : n instanceof o || n instanceof c ? (a = n.alias, 
        i = n.expr) : l(21273, {
            selectable: n
        }), void 0 !== t[a]) throw new s("invalid-argument", `Duplicate alias or field '${a}'`);
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
    if (__PRIVATE_isString$1(s)) {
        return e(s);
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
        if (u(a)) return i(a);
        if (a instanceof t) return a;
        e = p(a) ? h(a) : a instanceof Array ? b(a) : 
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
 */ (a) ? d(a) : m(a, void 0);
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
        f(a) ? (s = [ a, ...e ], t = {}) : ({fields: s, ...t} = a);
        // Convert user land convenience types to internal types
                const n = __PRIVATE_selectablesToMap(s), i = new w(n, t);
        // Create stage object
                // Add stage to the pipeline
        return this._addStage(i);
    }
    removeFields(s, ...t) {
        // Process argument union(s) from method overloads
        const n = g(s) || __PRIVATE_isString$1(s) ? {} : s, i = (g(s) || __PRIVATE_isString$1(s) ? [ s, ...t ] : s.fields).map((s => __PRIVATE_isString$1(s) ? e(s) : s)), r = new _(i, n);
        // Add stage to the pipeline
        return this._addStage(r);
    }
    define(a, ...e) {
        // Process argument union(s) from method overloads
        const s = T(a) ? {} : a, t = __PRIVATE_selectablesToMap(T(a) ? [ a, ...e ] : a.variables), n = new P(t, s);
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
        return new x("array", [ __PRIVATE_fieldOrExpression(this) ]);
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
        return new x("scalar", [ __PRIVATE_fieldOrExpression(this) ]);
    }
    select(e, ...s) {
        // Process argument union(s) from method overloads
        const t = f(e) || __PRIVATE_isString$1(e) ? {} : e, n = __PRIVATE_selectablesToMap(f(e) || __PRIVATE_isString$1(e) ? [ e, ...s ] : e.selections), i = new y(n, t);
        // Add stage to the pipeline
        return this._addStage(i);
    }
    where(a) {
        // Process argument union(s) from method overloads
        const e = E(a) ? {} : a, s = E(a) ? a : a.condition, t = new A(s, e);
        // Add stage to the pipeline
        return this._addStage(t);
    }
    offset(a) {
        // Process argument union(s) from method overloads
        let e, s;
        __PRIVATE_isNumber$1(a) ? (e = {}, s = a) : (e = a, s = a.offset);
        // Create stage object
                const t = new I(s, e);
        // Add stage to the pipeline
                return this._addStage(t);
    }
    limit(a) {
        // Process argument union(s) from method overloads
        const e = __PRIVATE_isNumber$1(a) ? {} : a, s = __PRIVATE_isNumber$1(a) ? a : a.limit, t = new v(s, e);
        // Add stage to the pipeline
        return this._addStage(t);
    }
    distinct(e, ...s) {
        // Process argument union(s) from method overloads
        const t = __PRIVATE_isString$1(e) || f(e) ? {} : e, n = __PRIVATE_selectablesToMap(__PRIVATE_isString$1(e) || f(e) ? [ e, ...s ] : e.groups), i = new M(n, t);
        // Add stage to the pipeline
        return this._addStage(i);
    }
    aggregate(a, ...e) {
        // Process argument union(s) from method overloads
        const t = O(a) ? {} : a, n = O(a) ? [ a, ...e ] : a.accumulators, i = O(a) ? [] : a.groups ?? [], r = function __PRIVATE_aliasedAggregateToMap(a) {
            return a.reduce(((a, e) => {
                if (void 0 !== a.get(e.alias)) throw new s("invalid-argument", `Duplicate alias or field '${e.alias}'`);
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
 */ (n), o = __PRIVATE_selectablesToMap(i), c = new V(o, r, t);
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
        const e = S(a.field), s = function __PRIVATE_vectorToExpr(a) {
            if (a instanceof t) return a;
            if (a instanceof n) return i(a);
            if (Array.isArray(a)) return i(r(a));
            throw new Error("Unsupported value: " + typeof a);
        }(a.vectorValue), o = {
            distanceField: a.distanceField ? S(a.distanceField) : void 0,
            limit: a.limit,
            rawOptions: a.rawOptions
        }, c = new D(s, e, a.distanceMeasure, o);
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
        const e = a.addFields ? __PRIVATE_selectablesToObject(a.addFields) : void 0, s = j(a.query) ? a.query : q(a.query), t = F(a.sort) ? [ a.sort ] : a.sort, n = {
            ...a,
            addFields: e,
            select: undefined,
            query: s,
            sort: t
        }, i = new C(n);
        // Add stage to the pipeline
        return this._addStage(i);
    }
    sort(a, ...e) {
        // Process argument union(s) from method overloads
        const s = F(a) ? {} : a, t = F(a) ? [ a, ...e ] : a.orderings, n = new L(t, s);
        // Add stage to the pipeline
        return this._addStage(n);
    }
    replaceWith(e) {
        // Process argument union(s) from method overloads
        const s = __PRIVATE_isString$1(e) || j(e) ? {} : e, t = __PRIVATE_fieldOrExpression(__PRIVATE_isString$1(e) || j(e) ? e : e.map), n = new $(t, s);
        // Add stage to the pipeline
        return this._addStage(n);
    }
    sample(a) {
        // Process argument union(s) from method overloads
        const e = __PRIVATE_isNumber$1(a) ? {} : a;
        let s, t;
        __PRIVATE_isNumber$1(a) ? (s = a, t = "documents") : __PRIVATE_isNumber$1(a.documents) ? (s = a.documents, t = "documents") : (s = a.percentage, 
        t = "percent");
        // Create stage object
                const n = new N(s, t, e);
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
                const t = new U(s, e);
        // Add stage to the pipeline
                return this._addStage(t);
    }
    unnest(e, s) {
        // Process argument union(s) from method overloads
        let t, n, i;
        f(e) ? (t = {}, n = e, i = s) : ({selectable: n, indexField: i, ...t} = e);
        // Convert user land convenience types to internal types
                const r = n.alias, o = n.expr;
        __PRIVATE_isString$1(i) && (t.indexField = G(i, "unnest"));
        // Create stage object
                const c = new W(r, o, t);
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
        const n = e.map((a => a instanceof t || a instanceof k ? a : p(a) ? B(a) : m(a, "rawStage"))), i = new K(a, n, s ?? {});
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
        const s = __PRIVATE_isString$1(e) || z(e) ? {} : e, t = __PRIVATE_isString$1(e) || z(e) ? e : e.collection;
        // Validate that a user provided reference is for the same Firestore DB
        z(t) && this._validateReference(t);
        // Convert user land convenience types to internal types
                const n = __PRIVATE_isString$1(t) ? t : t.path, i = new H(n, s), r = this.userDataReader.createContext(3 /* UserDataSource.Argument */ , "collection");
        // Create stage object
                // Add stage to the pipeline
        return i._readUserData(r), this._createPipeline([ i ]);
    }
    collectionGroup(e) {
        // Process argument union(s) from method overloads
        let s, t;
        __PRIVATE_isString$1(e) ? (s = e, t = {}) : ({collectionId: s, ...t} = e);
        // Create stage object
                const n = new J(s, t), i = this.userDataReader.createContext(3 /* UserDataSource.Argument */ , "collectionGroup");
        // User data must be read in the context of the API method to
        // provide contextual errors
                // Add stage to the pipeline
        return n._readUserData(i), this._createPipeline([ n ]);
    }
    database(a) {
        // Create stage object
        const e = new Q(
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
        t.filter((a => a instanceof X)).forEach((a => this._validateReference(a)));
        // Convert user land convenience types to internal types
        const n = t.map((e => __PRIVATE_isString$1(e) ? e : e.path)), i = new Y(n, s), r = this.userDataReader.createContext(3 /* UserDataSource.Argument */ , "documents");
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
        return this._createPipeline(Z(a._query, a.firestore));
    }
    _validateReference(a) {
        const e = a.firestore._databaseId;
        if (!e.isEqual(this.databaseId)) throw new s(aa.INVALID_ARGUMENT, `Invalid ${a instanceof ea ? "CollectionReference" : "DocumentReference"}. The project ID ("${e.projectId}") or the database ("${e.database}") does not match the project ID ("${this.databaseId.projectId}") and database ("${this.databaseId.database}") of the target database of this Pipeline.`);
    }
}

function subcollection(e) {
    // Process argument union(s) from method overloads
    let s, t;
    __PRIVATE_isString$1(e) ? (s = e, t = {}) : ({path: s, ...t} = e);
    // Create stage object
        const n = new sa(s, t);
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
        g(a) && (a = a.fieldName);
        const e = this._fields.field(ta("DocumentSnapshot.get", a));
        return null !== e ? this._userDataWriter.convertValue(e, this._listenOptions?.serverTimestampBehavior) : void 0;
    }
}

/**
 * Test equality of two PipelineResults.
 * @param left - First PipelineResult to compare.
 * @param right - Second PipelineResult to compare.
 */ function pipelineResultEqual(a, e) {
    return a === e || na(a._ref, e._ref, ia) && na(a._fields, e._fields, ((a, e) => a.isEqual(e)));
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
    if (!t._db) return Promise.reject(new s(aa.FAILED_PRECONDITION, "This pipeline was created without a database (e.g., as a subcollection pipeline) and cannot be executed directly. It can only be used as part of another pipeline."));
    const r = ra(t._db, da), o = oa(r), c = la(r).createContext(3 /* UserDataSource.Argument */ , "execute");
    t._readUserData(c);
    const l = new ua(r), u = new pa(i, n);
    u._readUserData(c);
    const p = new ma(t, u);
    return ha(o, p).then((a => {
        // Get the execution time from the first result.
        // firestoreClientExecutePipeline returns at least one PipelineStreamElement
        // even if the returned document set is empty.
        const e = a.length > 0 ? a[0].executionTime?.toTimestamp() : void 0, s = a.filter((a => !!a.fields)).map((a => new PipelineResult(l, a.fields, a.key?.path ? new X(r, null, a.key) : void 0, a.createTime?.toTimestamp(), a.updateTime?.toTimestamp())));
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
da.prototype.pipeline = function() {
    const a = la(this);
    return new PipelineSource(this._databaseId, a, (e => new Pipeline(this, a, new ua(this), e)));
};

export { k as AggregateFunction, c as AliasedExpression, t as Expression, o as Field, x as FunctionExpression, Pipeline, PipelineResult, PipelineSnapshot, PipelineSource, b as array, i as constant, q as documentMatches, execute, e as field, h as map, pipelineResultEqual, subcollection };
//# sourceMappingURL=pipelines.esm.js.map
