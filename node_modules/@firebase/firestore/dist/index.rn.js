import { _registerComponent as t, registerVersion as e, SDK_VERSION as n } from "@firebase/app";

import { Component as r } from "@firebase/component";

import { ac as s, cq as o, cr as i, cs as a, ct as u, cu as c, Y as l, a3 as h, cv as d, cw as p, cx as _, cy as f, a8 as m, cz as y, cA as g, cB as w, cC as I, F as A, a0 as S, cD as T, cE as P, cF as E, cG as b, cH as C, cI as R, cJ as F, cK as D, cL as Q, cM as x, cN as O, cO as q, cP as M, cQ as N, a6 as B, a7 as L, cR as W, cS as $, a9 as J, cT as k, cU as G, cV as j, cW as U, cX as H, cY as Y, cZ as z, c_ as K, c$ as Z, d0 as X, d1 as tt, d2 as et, d3 as nt, d4 as rt, d5 as st, d6 as ot, d7 as it, d8 as at, d9 as ut, b as ct, da as lt, db as ht, dc as dt, dd as pt, de as _t, df as ft, dg as mt, dh as yt, di as gt, dj as wt, dk as It, dl as At, dm as St, dn as Tt, dp as Pt, dq as Et, dr as bt, ds as Ct, dt as vt, du as Rt, dv as Ft, dw as Vt, dx as Dt, dy as Qt, dz as xt, dA as Ot, dB as qt, dC as Mt, dD as Nt } from "./common-C7mVdMAg.rn.js";

export { dE as CACHE_SIZE_UNLIMITED, a1 as CollectionReference, dF as FieldValue, dG as GeoPoint, dH as LoadBundleTask, dI as Timestamp, V as VectorValue, dJ as _ByteString, dK as _DatabaseId, dL as _EmptyAppCheckTokenProvider, dM as _EmptyAuthCredentialsProvider, dN as _FieldPath, dO as _debugAssert, dP as _internalAggregationQueryToProtoRunAggregationQueryRequest, dQ as _internalQueryToProtoQueryTarget, dR as _isBase64Available, dS as _validateIsNotUsedTogether, dT as arrayRemove, dU as arrayUnion, dV as clearIndexedDbPersistence, dW as collection, dX as collectionGroup, dY as connectFirestoreEmulator, dZ as deleteField, d_ as disableNetwork, d$ as documentId, e0 as enableIndexedDbPersistence, e1 as enableMultiTabIndexedDbPersistence, e2 as enableNetwork, e3 as getFirestore, e4 as increment, e5 as initializeFirestore, e6 as maximum, e7 as minimum, a5 as refEqual, e8 as serverTimestamp, e9 as setLogLevel, ea as terminate, v as vector, eb as waitForPendingWrites } from "./common-C7mVdMAg.rn.js";

import { getModularInstance as Bt, deepEqual as Lt } from "@firebase/util";

import "@firebase/webchannel-wrapper/bloom-blob";

import "@firebase/logger";

import "@firebase/webchannel-wrapper/webchannel-blob";

import "re2js";

/**
 * @license
 * Copyright 2017 Google LLC
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
 */ function __PRIVATE_isPartialObserver(t) {
    /**
 * Returns true if obj is an object and contains at least one of the specified
 * methods.
 */
    return function __PRIVATE_implementsAnyMethods(t, e) {
        if ("object" != typeof t || null === t) return !1;
        const n = t;
        for (const t of e) if (t in n && "function" == typeof n[t]) return !0;
        return !1;
    }(t, [ "next", "error", "complete" ]);
}

const Wt = "@firebase/firestore", $t = "4.17.0";

/**
 * @license
 * Copyright 2022 Google LLC
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
 * Represents an aggregation that can be performed by Firestore.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class AggregateField {
    /**
     * Create a new AggregateField<T>
     * @param aggregateType - Specifies the type of aggregation operation to perform.
     * @param _internalFieldPath - Optionally specifies the field that is aggregated.
     * @internal
     */
    constructor(t = "count", e) {
        this._internalFieldPath = e, 
        /** A type string to uniquely identify instances of this class. */
        this.type = "AggregateField", this.aggregateType = t;
    }
}

/**
 * The results of executing an aggregation query.
 */ class AggregateQuerySnapshot {
    /** @hideconstructor */
    constructor(t, e, n) {
        this._userDataWriter = e, this._data = n, 
        /** A type string to uniquely identify instances of this class. */
        this.type = "AggregateQuerySnapshot", this.query = t;
    }
    /**
     * Returns the results of the aggregations performed over the underlying
     * query.
     *
     * The keys of the returned object will be the same as those of the
     * `AggregateSpec` object specified to the aggregation method, and the values
     * will be the corresponding aggregation result.
     *
     * @returns The results of the aggregations performed over the underlying
     * query.
     */    data() {
        return this._userDataWriter.convertObjectMap(this._data);
    }
    /**
     * @internal
     * @private
     *
     * Retrieves all fields in the snapshot as a proto value.
     *
     * @returns An `Object` containing all fields in the snapshot.
     */    _fieldsProto() {
        // Return the cloned value to prevent manipulation of the Snapshot's data
        return new c({
            mapValue: {
                fields: this._data
            }
        }).clone().value.mapValue.fields;
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
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
 * A `DocumentSnapshot` contains data read from a document in your Firestore
 * database. The data can be extracted with `.data()` or `.get(<field>)` to
 * get a specific field.
 *
 * For a `DocumentSnapshot` that points to a non-existing document, any data
 * access will return 'undefined'. You can use the `exists()` method to
 * explicitly verify a document's existence.
 */ let Jt = class DocumentSnapshot {
    // Note: This class is stripped down version of the DocumentSnapshot in
    // the legacy SDK. The changes are:
    // - No support for SnapshotMetadata.
    // - No support for SnapshotOptions.
    /** @hideconstructor protected */
    constructor(t, e, n, r, s) {
        this._firestore = t, this._userDataWriter = e, this._key = n, this._document = r, 
        this._converter = s;
    }
    /** Property of the `DocumentSnapshot` that provides the document's ID. */    get id() {
        return this._key.path.lastSegment();
    }
    /**
     * The `DocumentReference` for the document included in the `DocumentSnapshot`.
     */    get ref() {
        return new l(this._firestore, this._converter, this._key);
    }
    /**
     * Signals whether or not the document at the snapshot's location exists.
     *
     * @returns true if the document exists.
     */    exists() {
        return null !== this._document;
    }
    /**
     * Retrieves all fields in the document as an `Object`. Returns `undefined` if
     * the document doesn't exist.
     *
     * @returns An `Object` containing all fields in the document or `undefined`
     * if the document doesn't exist.
     */    data() {
        if (this._document) {
            if (this._converter) {
                // We only want to use the converter and create a new DocumentSnapshot
                // if a converter has been provided.
                const t = new kt(this._firestore, this._userDataWriter, this._key, this._document, 
                /* converter= */ null);
                return this._converter.fromFirestore(t);
            }
            return this._userDataWriter.convertValue(this._document.data.value);
        }
    }
    /**
     * @internal
     * @private
     *
     * Retrieves all fields in the document as a proto Value. Returns `undefined` if
     * the document doesn't exist.
     *
     * @returns An `Object` containing all fields in the document or `undefined`
     * if the document doesn't exist.
     */    _fieldsProto() {
        // Return a cloned value to prevent manipulation of the Snapshot's data
        return this._document?.data.clone().value.mapValue.fields ?? void 0;
    }
    /**
     * Retrieves the field specified by `fieldPath`. Returns `undefined` if the
     * document or field doesn't exist.
     *
     * @param fieldPath - The path (for example 'foo' or 'foo.bar') to a specific
     * field.
     * @returns The data at the specified field location or undefined if no such
     * field exists in the document.
     */
    // We are using `any` here to avoid an explicit cast by our users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(t) {
        if (this._document) {
            const e = this._document.data.field(h("DocumentSnapshot.get", t));
            if (null !== e) return this._userDataWriter.convertValue(e);
        }
    }
}, kt = class QueryDocumentSnapshot extends Jt {
    /**
     * Retrieves all fields in the document as an `Object`.
     *
     * @override
     * @returns An `Object` containing all fields in the document.
     */
    data() {
        return super.data();
    }
};

/**
 * A `QueryDocumentSnapshot` contains data read from a document in your
 * Firestore database as part of a query. The document is guaranteed to exist
 * and its data can be extracted with `.data()` or `.get(<field>)` to get a
 * specific field.
 *
 * A `QueryDocumentSnapshot` offers the same API surface as a
 * `DocumentSnapshot`. Since query results contain only existing documents, the
 * `exists` property will always be true and `data()` will never return
 * 'undefined'.
 */
/**
 * @license
 * Copyright 2020 Google LLC
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
function __PRIVATE_validateHasExplicitOrderByForLimitToLast(t) {
    if ("L" /* LimitType.Last */ === t.limitType && 0 === t.explicitOrderBy.length) throw new A(S.UNIMPLEMENTED, "limitToLast() queries require specifying at least one orderBy() clause");
}

/**
 * An `AppliableConstraint` is an abstraction of a constraint that can be applied
 * to a Firestore query.
 */ class AppliableConstraint {}

/**
 * A `QueryConstraint` is used to narrow the set of documents returned by a
 * Firestore query. `QueryConstraint`s are created by invoking {@link where},
 * {@link orderBy}, {@link (startAt:1)}, {@link (startAfter:1)}, {@link
 * (endBefore:1)}, {@link (endAt:1)}, {@link limit}, {@link limitToLast} and
 * can then be passed to {@link (query:1)} to create a new query instance that
 * also contains this `QueryConstraint`.
 */ class QueryConstraint extends AppliableConstraint {}

function query(t, e, ...n) {
    let r = [];
    e instanceof AppliableConstraint && r.push(e), r = r.concat(n), function __PRIVATE_validateQueryConstraintArray(t) {
        const e = t.filter((t => t instanceof QueryCompositeFilterConstraint)).length, n = t.filter((t => t instanceof QueryFieldFilterConstraint)).length;
        if (e > 1 || e > 0 && n > 0) throw new A(S.INVALID_ARGUMENT, "InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.");
    }
    /**
 * @license
 * Copyright 2020 Google LLC
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
 * Converts custom model object of type T into `DocumentData` by applying the
 * converter if it exists.
 *
 * This function is used when converting user objects to `DocumentData`
 * because we want to provide the user with a more specific error message if
 * their `set()` or fails due to invalid data originating from a `toFirestore()`
 * call.
 */ (r);
    for (const e of r) t = e._apply(t);
    return t;
}

/**
 * A `QueryFieldFilterConstraint` is used to narrow the set of documents returned by
 * a Firestore query by filtering on one or more document fields.
 * `QueryFieldFilterConstraint`s are created by invoking {@link where} and can then
 * be passed to {@link (query:1)} to create a new query instance that also contains
 * this `QueryFieldFilterConstraint`.
 */ class QueryFieldFilterConstraint extends QueryConstraint {
    /**
     * @internal
     */
    constructor(t, e, n) {
        super(), this._field = t, this._op = e, this._value = n, 
        /** The type of this query constraint */
        this.type = "where";
    }
    static _create(t, e, n) {
        return new QueryFieldFilterConstraint(t, e, n);
    }
    _apply(t) {
        const e = this._parse(t);
        return __PRIVATE_validateNewFieldFilter(t._query, e), new p(t.firestore, t.converter, _(t._query, e));
    }
    _parse(t) {
        const e = m(t.firestore), n = function __PRIVATE_newQueryFilter(t, e, n, r, s, o, i) {
            let a;
            if (s.isKeyField()) {
                if ("array-contains" /* Operator.ARRAY_CONTAINS */ === o || "array-contains-any" /* Operator.ARRAY_CONTAINS_ANY */ === o) throw new A(S.INVALID_ARGUMENT, `Invalid Query. You can't perform '${o}' queries on documentId().`);
                if ("in" /* Operator.IN */ === o || "not-in" /* Operator.NOT_IN */ === o) {
                    __PRIVATE_validateDisjunctiveFilterElements(i, o);
                    const e = [];
                    for (const n of i) e.push(__PRIVATE_parseDocumentIdValue(r, t, n));
                    a = {
                        arrayValue: {
                            values: e
                        }
                    };
                } else a = __PRIVATE_parseDocumentIdValue(r, t, i);
            } else "in" /* Operator.IN */ !== o && "not-in" /* Operator.NOT_IN */ !== o && "array-contains-any" /* Operator.ARRAY_CONTAINS_ANY */ !== o || __PRIVATE_validateDisjunctiveFilterElements(i, o), 
            a = T(n, e, i, 
            /* allowArrays= */ "in" /* Operator.IN */ === o || "not-in" /* Operator.NOT_IN */ === o);
            const u = P.create(s, o, a);
            return u;
        }(t._query, "where", e, t.firestore._databaseId, this._field, this._op, this._value);
        return n;
    }
}

/**
 * Creates a {@link QueryFieldFilterConstraint} that enforces that documents
 * must contain the specified field and that the value should satisfy the
 * relation constraint provided.
 *
 * @param fieldPath - The path to compare
 * @param opStr - The operation string (e.g "&lt;", "&lt;=", "==", "&lt;",
 *   "&lt;=", "!=").
 * @param value - The value for comparison
 * @returns The created {@link QueryFieldFilterConstraint}.
 */ function where(t, e, n) {
    const r = e, s = h("where", t);
    return QueryFieldFilterConstraint._create(s, r, n);
}

/**
 * A `QueryCompositeFilterConstraint` is used to narrow the set of documents
 * returned by a Firestore query by performing the logical OR or AND of multiple
 * {@link QueryFieldFilterConstraint}s or {@link QueryCompositeFilterConstraint}s.
 * `QueryCompositeFilterConstraint`s are created by invoking {@link or} or
 * {@link and} and can then be passed to {@link (query:1)} to create a new query
 * instance that also contains the `QueryCompositeFilterConstraint`.
 */ class QueryCompositeFilterConstraint extends AppliableConstraint {
    /**
     * @internal
     */
    constructor(
    /** The type of this query constraint */
    t, e) {
        super(), this.type = t, this._queryConstraints = e;
    }
    static _create(t, e) {
        return new QueryCompositeFilterConstraint(t, e);
    }
    _parse(t) {
        const e = this._queryConstraints.map((e => e._parse(t))).filter((t => t.getFilters().length > 0));
        return 1 === e.length ? e[0] : d.create(e, this._getOperator());
    }
    _apply(t) {
        const e = this._parse(t);
        return 0 === e.getFilters().length ? t : (function __PRIVATE_validateNewFilter(t, e) {
            let n = t;
            const r = e.getFlattenedFilters();
            for (const t of r) __PRIVATE_validateNewFieldFilter(n, t), n = _(n, t);
        }
        // Checks if any of the provided filter operators are included in the given list of filters and
        // returns the first one that is, or null if none are.
        (t._query, e), new p(t.firestore, t.converter, _(t._query, e)));
    }
    _getQueryConstraints() {
        return this._queryConstraints;
    }
    _getOperator() {
        return "and" === this.type ? "and" /* CompositeOperator.AND */ : "or" /* CompositeOperator.OR */;
    }
}

/**
 * Creates a new {@link QueryCompositeFilterConstraint} that is a disjunction of
 * the given filter constraints. A disjunction filter includes a document if it
 * satisfies any of the given filters.
 *
 * @param queryConstraints - Optional. The list of
 * {@link QueryFilterConstraint}s to perform a disjunction for. These must be
 * created with calls to {@link where}, {@link or}, or {@link and}.
 * @returns The newly created {@link QueryCompositeFilterConstraint}.
 */ function or(...t) {
    // Only support QueryFilterConstraints
    return t.forEach((t => __PRIVATE_validateQueryFilterConstraint("or", t))), QueryCompositeFilterConstraint._create("or" /* CompositeOperator.OR */ , t);
}

/**
 * Creates a new {@link QueryCompositeFilterConstraint} that is a conjunction of
 * the given filter constraints. A conjunction filter includes a document if it
 * satisfies all of the given filters.
 *
 * @param queryConstraints - Optional. The list of
 * {@link QueryFilterConstraint}s to perform a conjunction for. These must be
 * created with calls to {@link where}, {@link or}, or {@link and}.
 * @returns The newly created {@link QueryCompositeFilterConstraint}.
 */ function and(...t) {
    // Only support QueryFilterConstraints
    return t.forEach((t => __PRIVATE_validateQueryFilterConstraint("and", t))), QueryCompositeFilterConstraint._create("and" /* CompositeOperator.AND */ , t);
}

/**
 * A `QueryOrderByConstraint` is used to sort the set of documents returned by a
 * Firestore query. `QueryOrderByConstraint`s are created by invoking
 * {@link orderBy} and can then be passed to {@link (query:1)} to create a new query
 * instance that also contains this `QueryOrderByConstraint`.
 *
 * Note: Documents that do not contain the orderBy field will not be present in
 * the query result.
 */ class QueryOrderByConstraint extends QueryConstraint {
    /**
     * @internal
     */
    constructor(t, e) {
        super(), this._field = t, this._direction = e, 
        /** The type of this query constraint */
        this.type = "orderBy";
    }
    static _create(t, e) {
        return new QueryOrderByConstraint(t, e);
    }
    _apply(t) {
        const e = function __PRIVATE_newQueryOrderBy(t, e, n) {
            if (null !== t.startAt) throw new A(S.INVALID_ARGUMENT, "Invalid query. You must not call startAt() or startAfter() before calling orderBy().");
            if (null !== t.endAt) throw new A(S.INVALID_ARGUMENT, "Invalid query. You must not call endAt() or endBefore() before calling orderBy().");
            const r = new E(e, n);
            return r;
        }
        /**
 * Create a `Bound` from a query and a document.
 *
 * Note that the `Bound` will always include the key of the document
 * and so only the provided document will compare equal to the returned
 * position.
 *
 * Will throw if the document does not contain all fields of the order by
 * of the query or if any of the fields in the order by are an uncommitted
 * server timestamp.
 */ (t._query, this._field, this._direction);
        return new p(t.firestore, t.converter, g(t._query, e));
    }
}

/**
 * Creates a {@link QueryOrderByConstraint} that sorts the query result by the
 * specified field, optionally in descending order instead of ascending.
 *
 * Note: Documents that do not contain the specified field will not be present
 * in the query result.
 *
 * @param fieldPath - The field to sort by.
 * @param directionStr - Optional direction to sort by ('asc' or 'desc'). If
 * not specified, order will be ascending.
 * @returns The created {@link QueryOrderByConstraint}.
 */ function orderBy(t, e = "asc") {
    const n = e, r = h("orderBy", t);
    return QueryOrderByConstraint._create(r, n);
}

/**
 * A `QueryLimitConstraint` is used to limit the number of documents returned by
 * a Firestore query.
 * `QueryLimitConstraint`s are created by invoking {@link limit} or
 * {@link limitToLast} and can then be passed to {@link (query:1)} to create a new
 * query instance that also contains this `QueryLimitConstraint`.
 */ class QueryLimitConstraint extends QueryConstraint {
    /**
     * @internal
     */
    constructor(
    /** The type of this query constraint */
    t, e, n) {
        super(), this.type = t, this._limit = e, this._limitType = n;
    }
    static _create(t, e, n) {
        return new QueryLimitConstraint(t, e, n);
    }
    _apply(t) {
        return new p(t.firestore, t.converter, y(t._query, this._limit, this._limitType));
    }
}

/**
 * Creates a {@link QueryLimitConstraint} that only returns the first matching
 * documents.
 *
 * @param limit - The maximum number of items to return.
 * @returns The created {@link QueryLimitConstraint}.
 */ function limit(t) {
    return I("limit", t), QueryLimitConstraint._create("limit", t, "F" /* LimitType.First */);
}

/**
 * Creates a {@link QueryLimitConstraint} that only returns the last matching
 * documents.
 *
 * You must specify at least one `orderBy` clause for `limitToLast` queries,
 * otherwise an exception will be thrown during execution.
 *
 * @param limit - The maximum number of items to return.
 * @returns The created {@link QueryLimitConstraint}.
 */ function limitToLast(t) {
    return I("limitToLast", t), QueryLimitConstraint._create("limitToLast", t, "L" /* LimitType.Last */);
}

/**
 * A `QueryStartAtConstraint` is used to exclude documents from the start of a
 * result set returned by a Firestore query.
 * `QueryStartAtConstraint`s are created by invoking {@link (startAt:1)} or
 * {@link (startAfter:1)} and can then be passed to {@link (query:1)} to create a
 * new query instance that also contains this `QueryStartAtConstraint`.
 */ class QueryStartAtConstraint extends QueryConstraint {
    /**
     * @internal
     */
    constructor(
    /** The type of this query constraint */
    t, e, n) {
        super(), this.type = t, this._docOrFields = e, this._inclusive = n;
    }
    static _create(t, e, n) {
        return new QueryStartAtConstraint(t, e, n);
    }
    _apply(t) {
        const e = __PRIVATE_newQueryBoundFromDocOrFields(t, this.type, this._docOrFields, this._inclusive);
        return new p(t.firestore, t.converter, w(t._query, e));
    }
}

function startAt(...t) {
    return QueryStartAtConstraint._create("startAt", t, 
    /*inclusive=*/ !0);
}

function startAfter(...t) {
    return QueryStartAtConstraint._create("startAfter", t, 
    /*inclusive=*/ !1);
}

/**
 * A `QueryEndAtConstraint` is used to exclude documents from the end of a
 * result set returned by a Firestore query.
 * `QueryEndAtConstraint`s are created by invoking {@link (endAt:1)} or
 * {@link (endBefore:1)} and can then be passed to {@link (query:1)} to create a new
 * query instance that also contains this `QueryEndAtConstraint`.
 */ class QueryEndAtConstraint extends QueryConstraint {
    /**
     * @internal
     */
    constructor(
    /** The type of this query constraint */
    t, e, n) {
        super(), this.type = t, this._docOrFields = e, this._inclusive = n;
    }
    static _create(t, e, n) {
        return new QueryEndAtConstraint(t, e, n);
    }
    _apply(t) {
        const e = __PRIVATE_newQueryBoundFromDocOrFields(t, this.type, this._docOrFields, this._inclusive);
        return new p(t.firestore, t.converter, f(t._query, e));
    }
}

function endBefore(...t) {
    return QueryEndAtConstraint._create("endBefore", t, 
    /*inclusive=*/ !1);
}

function endAt(...t) {
    return QueryEndAtConstraint._create("endAt", t, 
    /*inclusive=*/ !0);
}

/** Helper function to create a bound from a document or fields */ function __PRIVATE_newQueryBoundFromDocOrFields(t, e, n, r) {
    if (n[0] = Bt(n[0]), n[0] instanceof Jt) return function __PRIVATE_newQueryBoundFromDocument(t, e, n, r, s) {
        if (!r) throw new A(S.NOT_FOUND, `Can't use a DocumentSnapshot that doesn't exist for ${n}().`);
        const o = [];
        // Because people expect to continue/end a query at the exact document
        // provided, we need to use the implicit sort order rather than the explicit
        // sort order, because it's guaranteed to contain the document key. That way
        // the position becomes unambiguous and the query continues/ends exactly at
        // the provided document. Without the key (by using the explicit sort
        // orders), multiple documents could match the position, yielding duplicate
        // results.
                for (const n of b(t)) if (n.field.isKeyField()) o.push(C(e, r.key)); else {
            const t = r.data.field(n.field);
            if (R(t)) throw new A(S.INVALID_ARGUMENT, 'Invalid query. You are trying to start or end a query using a document for which the field "' + n.field + '" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');
            if (null === t) {
                const t = n.field.canonicalString();
                throw new A(S.INVALID_ARGUMENT, `Invalid query. You are trying to start or end a query using a document for which the field '${t}' (used as the orderBy) does not exist.`);
            }
            o.push(t);
        }
        return new F(o, s);
    }
    /**
 * Converts a list of field values to a `Bound` for the given query.
 */ (t._query, t.firestore._databaseId, e, n[0]._document, r);
    {
        const s = m(t.firestore);
        return function __PRIVATE_newQueryBoundFromFields(t, e, n, r, s, o) {
            // Use explicit order by's because it has to match the query the user made
            const i = t.explicitOrderBy;
            if (s.length > i.length) throw new A(S.INVALID_ARGUMENT, `Too many arguments provided to ${r}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);
            const a = [];
            for (let o = 0; o < s.length; o++) {
                const u = s[o];
                if (i[o].field.isKeyField()) {
                    if ("string" != typeof u) throw new A(S.INVALID_ARGUMENT, `Invalid query. Expected a string for document ID in ${r}(), but got a ${typeof u}`);
                    if (!D(t) && -1 !== u.indexOf("/")) throw new A(S.INVALID_ARGUMENT, `Invalid query. When querying a collection and ordering by documentId(), the value passed to ${r}() must be a plain document ID, but '${u}' contains a slash.`);
                    const n = t.path.child(Q.fromString(u));
                    if (!x.isDocumentKey(n)) throw new A(S.INVALID_ARGUMENT, `Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${r}() must result in a valid document path, but '${n}' is not because it contains an odd number of segments.`);
                    const s = new x(n);
                    a.push(C(e, s));
                } else {
                    const t = T(n, r, u);
                    a.push(t);
                }
            }
            return new F(a, o);
        }
        /**
 * Parses the given `documentIdValue` into a `ReferenceValue`, throwing
 * appropriate errors if the value is anything other than a `DocumentReference`
 * or `string`, or if the string is malformed.
 */ (t._query, t.firestore._databaseId, s, e, n, r);
    }
}

function __PRIVATE_parseDocumentIdValue(t, e, n) {
    if ("string" == typeof (n = Bt(n))) {
        if ("" === n) throw new A(S.INVALID_ARGUMENT, "Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");
        if (!D(e) && -1 !== n.indexOf("/")) throw new A(S.INVALID_ARGUMENT, `Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${n}' contains a '/' character.`);
        const r = e.path.child(Q.fromString(n));
        if (!x.isDocumentKey(r)) throw new A(S.INVALID_ARGUMENT, `Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);
        return C(t, new x(r));
    }
    if (n instanceof l) return C(t, n._key);
    throw new A(S.INVALID_ARGUMENT, `Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${O(n)}.`);
}

/**
 * Validates that the value passed into a disjunctive filter satisfies all
 * array requirements.
 */ function __PRIVATE_validateDisjunctiveFilterElements(t, e) {
    if (!Array.isArray(t) || 0 === t.length) throw new A(S.INVALID_ARGUMENT, `Invalid Query. A non-empty array is required for '${e.toString()}' filters.`);
}

/**
 * Given an operator, returns the set of operators that cannot be used with it.
 *
 * This is not a comprehensive check, and this function should be removed in the
 * long term. Validations should occur in the Firestore backend.
 *
 * Operators in a query must adhere to the following set of rules:
 * 1. Only one inequality per query.
 * 2. `NOT_IN` cannot be used with array, disjunctive, or `NOT_EQUAL` operators.
 */ function __PRIVATE_validateNewFieldFilter(t, e) {
    const n = function __PRIVATE_findOpInsideFilters(t, e) {
        for (const n of t) for (const t of n.getFlattenedFilters()) if (e.indexOf(t.op) >= 0) return t.op;
        return null;
    }(t.filters, function __PRIVATE_conflictingOps(t) {
        switch (t) {
          case "!=" /* Operator.NOT_EQUAL */ :
            return [ "!=" /* Operator.NOT_EQUAL */ , "not-in" /* Operator.NOT_IN */ ];

          case "array-contains-any" /* Operator.ARRAY_CONTAINS_ANY */ :
          case "in" /* Operator.IN */ :
            return [ "not-in" /* Operator.NOT_IN */ ];

          case "not-in" /* Operator.NOT_IN */ :
            return [ "array-contains-any" /* Operator.ARRAY_CONTAINS_ANY */ , "in" /* Operator.IN */ , "not-in" /* Operator.NOT_IN */ , "!=" /* Operator.NOT_EQUAL */ ];

          default:
            return [];
        }
    }(e.op));
    if (null !== n) 
    // Special case when it's a duplicate op to give a slightly clearer error message.
    throw n === e.op ? new A(S.INVALID_ARGUMENT, `Invalid query. You cannot use more than one '${e.op.toString()}' filter.`) : new A(S.INVALID_ARGUMENT, `Invalid query. You cannot use '${e.op.toString()}' filters with '${n.toString()}' filters.`);
}

function __PRIVATE_validateQueryFilterConstraint(t, e) {
    if (!(e instanceof QueryFieldFilterConstraint || e instanceof QueryCompositeFilterConstraint)) throw new A(S.INVALID_ARGUMENT, `Function ${t}() requires AppliableConstraints created with a call to 'where(...)', 'or(...)', or 'and(...)'.`);
}

function __PRIVATE_applyFirestoreDataConverter(t, e, n) {
    let r;
    // Cast to `any` in order to satisfy the union type constraint on
    // toFirestore().
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return r = t ? n && (n.merge || n.mergeFields) ? t.toFirestore(e, n) : t.toFirestore(e) : e, 
    r;
}

class __PRIVATE_LiteUserDataWriter extends q {
    constructor(t) {
        super(), this.firestore = t;
    }
    convertBytes(t) {
        return new M(t);
    }
    convertReference(t) {
        const e = this.convertDocumentKey(t, this.firestore._databaseId);
        return new l(this.firestore, /* converter= */ null, e);
    }
}

/**
 * @license
 * Copyright 2022 Google LLC
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
 * Create an AggregateField object that can be used to compute the sum of
 * a specified field over a range of documents in the result set of a query.
 * @param field - Specifies the field to sum across the result set.
 */ function sum(t) {
    return new AggregateField("sum", h("sum", t));
}

/**
 * Create an AggregateField object that can be used to compute the average of
 * a specified field over a range of documents in the result set of a query.
 * @param field - Specifies the field to average across the result set.
 */ function average(t) {
    return new AggregateField("avg", h("average", t));
}

/**
 * Create an AggregateField object that can be used to compute the count of
 * documents in the result set of a query.
 */ function count() {
    return new AggregateField("count");
}

/**
 * Compares two 'AggregateField` instances for equality.
 *
 * @param left - Compare this AggregateField to the `right`.
 * @param right - Compare this AggregateField to the `left`.
 */ function aggregateFieldEqual(t, e) {
    return t instanceof AggregateField && e instanceof AggregateField && t.aggregateType === e.aggregateType && t._internalFieldPath?.canonicalString() === e._internalFieldPath?.canonicalString();
}

/**
 * Compares two `AggregateQuerySnapshot` instances for equality.
 *
 * Two `AggregateQuerySnapshot` instances are considered "equal" if they have
 * underlying queries that compare equal, and the same data.
 *
 * @param left - The first `AggregateQuerySnapshot` to compare.
 * @param right - The second `AggregateQuerySnapshot` to compare.
 *
 * @returns `true` if the objects are "equal", as defined above, or `false`
 * otherwise.
 */ function aggregateQuerySnapshotEqual(t, e) {
    return N(t.query, e.query) && Lt(t.data(), e.data());
}

/**
 * @license
 * Copyright 2022 Google LLC
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
 * Calculates the number of documents in the result set of the given query
 * without actually downloading the documents.
 *
 * Using this function to count the documents is efficient because only the
 * final count, not the documents' data, is downloaded. This function can
 * count the documents in cases where the result set is prohibitively large to
 * download entirely (thousands of documents).
 *
 * The result received from the server is presented, unaltered, without
 * considering any local state. That is, documents in the local cache are not
 * taken into consideration, neither are local modifications not yet
 * synchronized with the server. Previously-downloaded results, if any, are not
 * used. Every invocation of this function necessarily involves a round trip to
 * the server.
 *
 * @param query - The query whose result set size is calculated.
 * @returns A Promise that will be resolved with the count; the count can be
 * retrieved from `snapshot.data().count`, where `snapshot` is the
 * `AggregateQuerySnapshot` to which the returned Promise resolves.
 */ function getCountFromServer(t) {
    return getAggregateFromServer(t, {
        count: count()
    });
}

/**
 * Calculates the specified aggregations over the documents in the result
 * set of the given query without actually downloading the documents.
 *
 * Using this function to perform aggregations is efficient because only the
 * final aggregation values, not the documents' data, are downloaded. This
 * function can perform aggregations of the documents in cases where the result
 * set is prohibitively large to download entirely (thousands of documents).
 *
 * The result received from the server is presented, unaltered, without
 * considering any local state. That is, documents in the local cache are not
 * taken into consideration, neither are local modifications not yet
 * synchronized with the server. Previously-downloaded results, if any, are not
 * used. Every invocation of this function necessarily involves a round trip to
 * the server.
 *
 * @param query - The query whose result set is aggregated over.
 * @param aggregateSpec - An `AggregateSpec` object that specifies the aggregates
 * to perform over the result set. The AggregateSpec specifies aliases for each
 * aggregate, which can be used to retrieve the aggregate result.
 * @example
 * ```typescript
 * const aggregateSnapshot = await getAggregateFromServer(query, {
 *   countOfDocs: count(),
 *   totalHours: sum('hours'),
 *   averageScore: average('score')
 * });
 *
 * const countOfDocs: number = aggregateSnapshot.data().countOfDocs;
 * const totalHours: number = aggregateSnapshot.data().totalHours;
 * const averageScore: number | null = aggregateSnapshot.data().averageScore;
 * ```
 */ function getAggregateFromServer(t, e) {
    const n = B(t.firestore, s), r = L(n), o = W(e, ((t, e) => new k(e, t.aggregateType, t._internalFieldPath)));
    // Run the aggregation and convert the results
    return $(r, t._query, o).then((e => 
    /**
 * Converts the core aggregation result to an `AggregateQuerySnapshot`
 * that can be returned to the consumer.
 * @param query
 * @param aggregateResult - Core aggregation result
 * @internal
 */
    function __PRIVATE_convertToAggregateQuerySnapshot(t, e, n) {
        const r = new J(t), s = new AggregateQuerySnapshot(e, r, n);
        return s;
    }
    /**
 * @license
 * Copyright 2023 Google LLC
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
 */ (n, t, e)));
}

class __PRIVATE_MemoryLocalCacheImpl {
    constructor(t) {
        this.kind = "memory", this._onlineComponentProvider = j.provider, this._offlineComponentProvider = t?.garbageCollector ? t.garbageCollector._offlineComponentProvider : {
            build: () => new U(void 0)
        };
    }
    toJSON() {
        return {
            kind: this.kind
        };
    }
}

class __PRIVATE_PersistentLocalCacheImpl {
    constructor(t) {
        let e;
        this.kind = "persistent", t?.tabManager ? (t.tabManager._initialize(t), e = t.tabManager) : (e = persistentSingleTabManager(void 0), 
        e._initialize(t)), this._onlineComponentProvider = e._onlineComponentProvider, this._offlineComponentProvider = e._offlineComponentProvider;
    }
    toJSON() {
        return {
            kind: this.kind
        };
    }
}

class __PRIVATE_MemoryEagerGarbageCollectorImpl {
    constructor() {
        this.kind = "memoryEager", this._offlineComponentProvider = G.provider;
    }
    toJSON() {
        return {
            kind: this.kind
        };
    }
}

class __PRIVATE_MemoryLruGarbageCollectorImpl {
    constructor(t) {
        this.kind = "memoryLru", this._offlineComponentProvider = {
            build: () => new U(t)
        };
    }
    toJSON() {
        return {
            kind: this.kind
        };
    }
}

/**
 * Creates an instance of `MemoryEagerGarbageCollector`. This is also the
 * default garbage collector unless it is explicitly specified otherwise.
 */ function memoryEagerGarbageCollector() {
    return new __PRIVATE_MemoryEagerGarbageCollectorImpl;
}

/**
 * Creates an instance of `MemoryLruGarbageCollector`.
 *
 * A target size can be specified as part of the setting parameter. The
 * collector will start deleting documents once the cache size exceeds
 * the given size. The default cache size is 40MB (40 * 1024 * 1024 bytes).
 */ function memoryLruGarbageCollector(t) {
    return new __PRIVATE_MemoryLruGarbageCollectorImpl(t?.cacheSizeBytes);
}

/**
 * Creates an instance of `MemoryLocalCache`. The instance can be set to
 * `FirestoreSettings.cache` to tell the SDK which cache layer to use.
 */ function memoryLocalCache(t) {
    return new __PRIVATE_MemoryLocalCacheImpl(t);
}

/**
 * Creates an instance of `PersistentLocalCache`. The instance can be set to
 * `FirestoreSettings.cache` to tell the SDK which cache layer to use.
 *
 * Persistent cache cannot be used in a Node.js environment.
 */ function persistentLocalCache(t) {
    return new __PRIVATE_PersistentLocalCacheImpl(t);
}

class __PRIVATE_SingleTabManagerImpl {
    constructor(t) {
        this.forceOwnership = t, this.kind = "persistentSingleTab";
    }
    toJSON() {
        return {
            kind: this.kind
        };
    }
    /**
     * @internal
     */    _initialize(t) {
        this._onlineComponentProvider = j.provider, this._offlineComponentProvider = {
            build: e => new Y(e, t?.cacheSizeBytes, this.forceOwnership)
        };
    }
}

class __PRIVATE_MultiTabManagerImpl {
    constructor() {
        this.kind = "PersistentMultipleTab";
    }
    toJSON() {
        return {
            kind: this.kind
        };
    }
    /**
     * @internal
     */    _initialize(t) {
        this._onlineComponentProvider = j.provider, this._offlineComponentProvider = {
            build: e => new H(e, t?.cacheSizeBytes)
        };
    }
}

/**
 * Creates an instance of `PersistentSingleTabManager`.
 *
 * @param settings - Configures the created tab manager.
 */ function persistentSingleTabManager(t) {
    return new __PRIVATE_SingleTabManagerImpl(t?.forceOwnership);
}

/**
 * Creates an instance of `PersistentMultipleTabManager`.
 */ function persistentMultipleTabManager() {
    return new __PRIVATE_MultiTabManagerImpl;
}

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
 * @license
 * Copyright 2020 Google LLC
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
const Gt = "NOT SUPPORTED";

/**
 * Metadata about a snapshot, describing the state of the snapshot.
 */ class SnapshotMetadata {
    /** @hideconstructor */
    constructor(t, e) {
        this.hasPendingWrites = t, this.fromCache = e;
    }
    /**
     * Returns true if this `SnapshotMetadata` is equal to the provided one.
     *
     * @param other - The `SnapshotMetadata` to compare against.
     * @returns true if this `SnapshotMetadata` is equal to the provided one.
     */    isEqual(t) {
        return this.hasPendingWrites === t.hasPendingWrites && this.fromCache === t.fromCache;
    }
}

/**
 * A `DocumentSnapshot` contains data read from a document in your Firestore
 * database. The data can be extracted with `.data()` or `.get(<field>)` to
 * get a specific field.
 *
 * For a `DocumentSnapshot` that points to a non-existing document, any data
 * access will return 'undefined'. You can use the `exists()` method to
 * explicitly verify a document's existence.
 */ class DocumentSnapshot extends Jt {
    /** @hideconstructor protected */
    constructor(t, e, n, r, s, o) {
        super(t, e, n, r, o), this._firestore = t, this._firestoreImpl = t, this.metadata = s;
    }
    /**
     * Returns whether or not the data exists. True if the document exists.
     */    exists() {
        return super.exists();
    }
    /**
     * Retrieves all fields in the document as an `Object`. Returns `undefined` if
     * the document doesn't exist.
     *
     * By default, `serverTimestamp()` values that have not yet been
     * set to their final value will be returned as `null`. You can override
     * this by passing an options object.
     *
     * @param options - An options object to configure how data is retrieved from
     * the snapshot (for example the desired behavior for server timestamps that
     * have not yet been set to their final value).
     * @returns An `Object` containing all fields in the document or `undefined` if
     * the document doesn't exist.
     */    data(t = {}) {
        if (this._document) {
            if (this._converter) {
                // We only want to use the converter and create a new DocumentSnapshot
                // if a converter has been provided.
                const e = new QueryDocumentSnapshot(this._firestore, this._userDataWriter, this._key, this._document, this.metadata, 
                /* converter= */ null);
                return this._converter.fromFirestore(e, t);
            }
            return this._userDataWriter.convertValue(this._document.data.value, t.serverTimestamps);
        }
    }
    /**
     * Retrieves the field specified by `fieldPath`. Returns `undefined` if the
     * document or field doesn't exist.
     *
     * By default, a `serverTimestamp()` that has not yet been set to
     * its final value will be returned as `null`. You can override this by
     * passing an options object.
     *
     * @param fieldPath - The path (for example 'foo' or 'foo.bar') to a specific
     * field.
     * @param options - An options object to configure how the field is retrieved
     * from the snapshot (for example the desired behavior for server timestamps
     * that have not yet been set to their final value).
     * @returns The data at the specified field location or undefined if no such
     * field exists in the document.
     */
    // We are using `any` here to avoid an explicit cast by our users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(t, e = {}) {
        if (this._document) {
            const n = this._document.data.field(h("DocumentSnapshot.get", t));
            if (null !== n) return this._userDataWriter.convertValue(n, e.serverTimestamps);
        }
    }
    /**
     * Returns a JSON-serializable representation of this `DocumentSnapshot` instance.
     *
     * @returns a JSON representation of this object.  Throws a {@link FirestoreError} if this
     * `DocumentSnapshot` has pending writes.
     */    toJSON() {
        if (this.metadata.hasPendingWrites) throw new A(S.FAILED_PRECONDITION, "DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");
        const t = this._document, e = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (e.type = DocumentSnapshot._jsonSchemaVersion, e.bundle = "", e.bundleSource = "DocumentSnapshot", 
        e.bundleName = this._key.toString(), !t || !t.isValidDocument() || !t.isFoundDocument()) return e;
        this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields, "previous");
        return e.bundle = (this._firestore, this.ref.path, "NOT SUPPORTED"), e;
    }
}

function documentSnapshotFromJSON(t, e, n) {
    if (K(e, DocumentSnapshot._jsonSchema)) {
        if (e.bundle === Gt) throw new A(S.INVALID_ARGUMENT, "The provided JSON object was created in a client environment, which is not supported.");
        // Parse the bundle data.
                const r = Z(t._databaseId), s = X(e.bundle, r), o = s.va(), i = new tt(s.getMetadata(), r);
        for (const t of o) i.qu(t);
        // Ensure that we have the correct number of documents in the bundle.
                const a = i.documents;
        if (1 !== a.length) throw new A(S.INVALID_ARGUMENT, `Expected bundle data to contain 1 document, but it contains ${a.length} documents.`);
        // Build out the internal document data.
                const u = et(r, a[0].document), c = new x(Q.fromString(e.bundleName));
        // Return the external facing DocumentSnapshot.
        return new DocumentSnapshot(t, new __PRIVATE_LiteUserDataWriter(t), c, u, new SnapshotMetadata(
        /* hasPendingWrites= */ !1, 
        /* fromCache= */ !1), n || null);
    }
}

/**
 * A `QueryDocumentSnapshot` contains data read from a document in your
 * Firestore database as part of a query. The document is guaranteed to exist
 * and its data can be extracted with `.data()` or `.get(<field>)` to get a
 * specific field.
 *
 * A `QueryDocumentSnapshot` offers the same API surface as a
 * `DocumentSnapshot`. Since query results contain only existing documents, the
 * `exists` property will always be true and `data()` will never return
 * 'undefined'.
 */ DocumentSnapshot._jsonSchemaVersion = "firestore/documentSnapshot/1.0", DocumentSnapshot._jsonSchema = {
    type: lt("string", DocumentSnapshot._jsonSchemaVersion),
    bundleSource: lt("string", "DocumentSnapshot"),
    bundleName: lt("string"),
    bundle: lt("string")
};

class QueryDocumentSnapshot extends DocumentSnapshot {
    /**
     * Retrieves all fields in the document as an `Object`.
     *
     * By default, `serverTimestamp()` values that have not yet been
     * set to their final value will be returned as `null`. You can override
     * this by passing an options object.
     *
     * @override
     * @param options - An options object to configure how data is retrieved from
     * the snapshot (for example the desired behavior for server timestamps that
     * have not yet been set to their final value).
     * @returns An `Object` containing all fields in the document.
     */
    data(t = {}) {
        return super.data(t);
    }
}

/**
 * A `QuerySnapshot` contains zero or more `DocumentSnapshot` objects
 * representing the results of a query. The documents can be accessed as an
 * array via the `docs` property or enumerated using the `forEach` method. The
 * number of documents can be determined via the `empty` and `size`
 * properties.
 */ class QuerySnapshot {
    /** @hideconstructor */
    constructor(t, e, n, r) {
        this._firestore = t, this._userDataWriter = e, this._snapshot = r, this.metadata = new SnapshotMetadata(r.hasPendingWrites, r.fromCache), 
        this.query = n;
    }
    /** An array of all the documents in the `QuerySnapshot`. */    get docs() {
        const t = [];
        return this.forEach((e => t.push(e))), t;
    }
    /** The number of documents in the `QuerySnapshot`. */    get size() {
        return this._snapshot.docs.size;
    }
    /** True if there are no documents in the `QuerySnapshot`. */    get empty() {
        return 0 === this.size;
    }
    /**
     * Enumerates all of the documents in the `QuerySnapshot`.
     *
     * @param callback - A callback to be called with a `QueryDocumentSnapshot` for
     * each document in the snapshot.
     * @param thisArg - The `this` binding for the callback.
     */    forEach(t, e) {
        this._snapshot.docs.forEach((n => {
            t.call(e, new QueryDocumentSnapshot(this._firestore, this._userDataWriter, n.key, n, new SnapshotMetadata(this._snapshot.mutatedKeys.has(n.key), this._snapshot.fromCache), this.query.converter));
        }));
    }
    /**
     * Returns an array of the documents changes since the last snapshot. If this
     * is the first snapshot, all documents will be in the list as 'added'
     * changes.
     *
     * @param options - `SnapshotListenOptions` that control whether metadata-only
     * changes (i.e. only `DocumentSnapshot.metadata` changed) should trigger
     * snapshot events.
     */    docChanges(t = {}) {
        const e = !!t.includeMetadataChanges;
        if (e && this._snapshot.excludesMetadataChanges) throw new A(S.INVALID_ARGUMENT, "To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");
        return this._cachedChanges && this._cachedChangesIncludeMetadataChanges === e || (this._cachedChanges = 
        /** Calculates the array of `DocumentChange`s for a given `ViewSnapshot`. */
        function __PRIVATE_changesFromSnapshot(t, e) {
            if (t._snapshot.oldDocs.isEmpty()) {
                let e = 0;
                return t._snapshot.docChanges.map((n => {
                    rt(t._snapshot.query) ? st(t._snapshot.query) : ot(t.query._query);
                    const r = new QueryDocumentSnapshot(t._firestore, t._userDataWriter, n.doc.key, n.doc, new SnapshotMetadata(t._snapshot.mutatedKeys.has(n.doc.key), t._snapshot.fromCache), t.query.converter);
                    return n.doc, {
                        type: "added",
                        doc: r,
                        oldIndex: -1,
                        newIndex: e++
                    };
                }));
            }
            {
                // A `DocumentSet` that is updated incrementally as changes are applied to use
                // to lookup the index of a document.
                let n = t._snapshot.oldDocs;
                return t._snapshot.docChanges.filter((t => e || 3 /* ChangeType.Metadata */ !== t.type)).map((e => {
                    const r = new QueryDocumentSnapshot(t._firestore, t._userDataWriter, e.doc.key, e.doc, new SnapshotMetadata(t._snapshot.mutatedKeys.has(e.doc.key), t._snapshot.fromCache), t.query.converter);
                    let s = -1, o = -1;
                    return 0 /* ChangeType.Added */ !== e.type && (s = n.indexOf(e.doc.key), n = n.delete(e.doc.key)), 
                    1 /* ChangeType.Removed */ !== e.type && (n = n.add(e.doc), o = n.indexOf(e.doc.key)), 
                    {
                        type: __PRIVATE_resultChangeType(e.type),
                        doc: r,
                        oldIndex: s,
                        newIndex: o
                    };
                }));
            }
        }(this, e), this._cachedChangesIncludeMetadataChanges = e), this._cachedChanges;
    }
    /**
     * Returns a JSON-serializable representation of this `QuerySnapshot` instance.
     *
     * @returns a JSON representation of this object. Throws a {@link FirestoreError} if this
     * `QuerySnapshot` has pending writes.
     */    toJSON() {
        if (this.metadata.hasPendingWrites) throw new A(S.FAILED_PRECONDITION, "QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const t = {};
        t.type = QuerySnapshot._jsonSchemaVersion, t.bundleSource = "QuerySnapshot", t.bundleName = z.newId(), 
        this._firestore._databaseId.database, this._firestore._databaseId.projectId;
        const e = [], n = [], r = [];
        return this.docs.forEach((t => {
            null !== t._document && (e.push(t._document), n.push(this._userDataWriter.convertObjectMap(t._document.data.value.mapValue.fields, "previous")), 
            r.push(t.ref.path));
        })), t.bundle = (this._firestore, this.query._query, t.bundleName, "NOT SUPPORTED"), 
        t;
    }
}

function querySnapshotFromJSON(t, e, n) {
    if (K(e, QuerySnapshot._jsonSchema)) {
        if (e.bundle === Gt) throw new A(S.INVALID_ARGUMENT, "The provided JSON object was created in a client environment, which is not supported.");
        // Parse the bundle data.
                const r = Z(t._databaseId), s = X(e.bundle, r), o = s.va(), i = new tt(s.getMetadata(), r);
        for (const t of o) i.qu(t);
        if (1 !== i.queries.length) throw new A(S.INVALID_ARGUMENT, `Snapshot data expected 1 query but found ${i.queries.length} queries.`);
        // Create an internal Query object from the named query in the bundle.
                const a = nt(i.queries[0].bundledQuery), u = rt(a) ? st(a) : ot(a), c = i.documents;
        let l = new it(u);
        c.map((t => {
            const e = et(r, t.document);
            l = l.add(e);
        }));
        // Create a view snapshot of the query and documents.
        const h = at.fromInitialDocuments(a, l, ut() /* Zero mutated keys signifies no pending writes. */ , 
        /* fromCache= */ !1, 
        /* hasCachedResults= */ !1), d = new p(t, n || null, a);
        // Create an external Query object, required to construct the QuerySnapshot.
                // Return a new QuerySnapshot with all of the collected data.
        return new QuerySnapshot(t, new __PRIVATE_LiteUserDataWriter(t), d, h);
    }
}

function __PRIVATE_resultChangeType(t) {
    switch (t) {
      case 0 /* ChangeType.Added */ :
        return "added";

      case 2 /* ChangeType.Modified */ :
      case 3 /* ChangeType.Metadata */ :
        return "modified";

      case 1 /* ChangeType.Removed */ :
        return "removed";

      default:
        return ct(61501, {
            type: t
        });
    }
}

// TODO(firestoreexp): Add tests for snapshotEqual with different snapshot
// metadata
/**
 * Returns true if the provided snapshots are equal.
 *
 * @param left - A snapshot to compare.
 * @param right - A snapshot to compare.
 * @returns true if the snapshots are equal.
 */ function snapshotEqual(t, e) {
    return t instanceof DocumentSnapshot && e instanceof DocumentSnapshot ? t._firestore === e._firestore && t._key.isEqual(e._key) && (null === t._document ? null === e._document : t._document.isEqual(e._document)) && t._converter === e._converter : t instanceof QuerySnapshot && e instanceof QuerySnapshot && (t._firestore === e._firestore && N(t.query, e.query) && t.metadata.isEqual(e.metadata) && t._snapshot.isEqual(e._snapshot));
}

/**
 * @license
 * Copyright 2022 Google LLC
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
 */ QuerySnapshot._jsonSchemaVersion = "firestore/querySnapshot/1.0", QuerySnapshot._jsonSchema = {
    type: lt("string", QuerySnapshot._jsonSchemaVersion),
    bundleSource: lt("string", "QuerySnapshot"),
    bundleName: lt("string"),
    bundle: lt("string")
};

const jt = {
    maxAttempts: 5
};

/**
 * @license
 * Copyright 2020 Google LLC
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
 * A write batch, used to perform multiple writes as a single atomic unit.
 *
 * A `WriteBatch` object can be acquired by calling {@link writeBatch}. It
 * provides methods for adding writes to the write batch. None of the writes
 * will be committed (or visible locally) until {@link WriteBatch.commit} is
 * called.
 */
class WriteBatch {
    /** @hideconstructor */
    constructor(t, e) {
        this._firestore = t, this._commitHandler = e, this._mutations = [], this._committed = !1, 
        this._dataReader = m(t);
    }
    set(t, e, n) {
        this._verifyNotCommitted();
        const r = __PRIVATE_validateReference(t, this._firestore), s = __PRIVATE_applyFirestoreDataConverter(r.converter, e, n), o = ht(this._dataReader, "WriteBatch.set", r._key, s, null !== r.converter, n);
        return this._mutations.push(o.toMutation(r._key, dt.none())), this;
    }
    update(t, e, n, ...r) {
        this._verifyNotCommitted();
        const s = __PRIVATE_validateReference(t, this._firestore);
        // For Compat types, we have to "extract" the underlying types before
        // performing validation.
                let o;
        return o = "string" == typeof (e = Bt(e)) || e instanceof pt ? _t(this._dataReader, "WriteBatch.update", s._key, e, n, r) : ft(this._dataReader, "WriteBatch.update", s._key, e), 
        this._mutations.push(o.toMutation(s._key, dt.exists(!0))), this;
    }
    /**
     * Deletes the document referred to by the provided {@link DocumentReference}.
     *
     * @param documentRef - A reference to the document to be deleted.
     * @returns This `WriteBatch` instance. Used for chaining method calls.
     */    delete(t) {
        this._verifyNotCommitted();
        const e = __PRIVATE_validateReference(t, this._firestore);
        return this._mutations = this._mutations.concat(new mt(e._key, dt.none())), this;
    }
    /**
     * Commits all of the writes in this write batch as a single atomic unit.
     *
     * The result of these writes will only be reflected in document reads that
     * occur after the returned promise resolves. If the client is offline, the
     * write fails. If you would like to see local modifications or buffer writes
     * until the client is online, use the full Firestore SDK.
     *
     * @returns A `Promise` resolved once all of the writes in the batch have been
     * successfully written to the backend as an atomic unit (note that it won't
     * resolve while you're offline).
     */    commit() {
        return this._verifyNotCommitted(), this._committed = !0, this._mutations.length > 0 ? this._commitHandler(this._mutations) : Promise.resolve();
    }
    _verifyNotCommitted() {
        if (this._committed) throw new A(S.FAILED_PRECONDITION, "A write batch can no longer be used after commit() has been called.");
    }
}

function __PRIVATE_validateReference(t, e) {
    if ((t = Bt(t)).firestore !== e) throw new A(S.INVALID_ARGUMENT, "Provided document reference is from a different Firestore instance.");
    return t;
}

/**
 * @license
 * Copyright 2020 Google LLC
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
// TODO(mrschmidt) Consider using `BaseTransaction` as the base class in the
// legacy SDK.
/**
 * A reference to a transaction.
 *
 * The `Transaction` object passed to a transaction's `updateFunction` provides
 * the methods to read and write data within the transaction context. See
 * {@link runTransaction}.
 */ let Ut = class Transaction {
    /** @hideconstructor */
    constructor(t, e) {
        this._firestore = t, this._transaction = e, this._dataReader = m(t);
    }
    /**
     * Reads the document referenced by the provided {@link DocumentReference}.
     *
     * @param documentRef - A reference to the document to be read.
     * @returns A `DocumentSnapshot` with the read data.
     */    get(t) {
        const e = __PRIVATE_validateReference(t, this._firestore), n = new __PRIVATE_LiteUserDataWriter(this._firestore);
        return this._transaction.lookup([ e._key ]).then((t => {
            if (!t || 1 !== t.length) return ct(24041);
            const r = t[0];
            if (r.isFoundDocument()) return new Jt(this._firestore, n, r.key, r, e.converter);
            if (r.isNoDocument()) return new Jt(this._firestore, n, e._key, null, e.converter);
            throw ct(18433, {
                doc: r
            });
        }));
    }
    set(t, e, n) {
        const r = __PRIVATE_validateReference(t, this._firestore), s = __PRIVATE_applyFirestoreDataConverter(r.converter, e, n), o = ht(this._dataReader, "Transaction.set", r._key, s, null !== r.converter, n);
        return this._transaction.set(r._key, o), this;
    }
    update(t, e, n, ...r) {
        const s = __PRIVATE_validateReference(t, this._firestore);
        // For Compat types, we have to "extract" the underlying types before
        // performing validation.
                let o;
        return o = "string" == typeof (e = Bt(e)) || e instanceof pt ? _t(this._dataReader, "Transaction.update", s._key, e, n, r) : ft(this._dataReader, "Transaction.update", s._key, e), 
        this._transaction.update(s._key, o), this;
    }
    /**
     * Deletes the document referred to by the provided {@link DocumentReference}.
     *
     * @param documentRef - A reference to the document to be deleted.
     * @returns This `Transaction` instance. Used for chaining method calls.
     */    delete(t) {
        const e = __PRIVATE_validateReference(t, this._firestore);
        return this._transaction.delete(e._key), this;
    }
};

/**
 * @license
 * Copyright 2020 Google LLC
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
 * A reference to a transaction.
 *
 * The `Transaction` object passed to a transaction's `updateFunction` provides
 * the methods to read and write data within the transaction context. See
 * {@link runTransaction}.
 */ class Transaction extends Ut {
    // This class implements the same logic as the Transaction API in the Lite SDK
    // but is subclassed in order to return its own DocumentSnapshot types.
    /** @hideconstructor */
    constructor(t, e) {
        super(t, e), this._firestore = t;
    }
    /**
     * Reads the document referenced by the provided {@link DocumentReference}.
     *
     * @param documentRef - A reference to the document to be read.
     * @returns A `DocumentSnapshot` with the read data.
     */    get(t) {
        const e = __PRIVATE_validateReference(t, this._firestore), n = new J(this._firestore);
        return super.get(t).then((t => new DocumentSnapshot(this._firestore, n, e._key, t._document, new SnapshotMetadata(
        /* hasPendingWrites= */ !1, 
        /* fromCache= */ !1), e.converter)));
    }
}

/**
 * Executes the given `updateFunction` and then attempts to commit the changes
 * applied within the transaction. If any document read within the transaction
 * has changed, Cloud Firestore retries the `updateFunction`. If it fails to
 * commit after 5 attempts, the transaction fails.
 *
 * The maximum number of writes allowed in a single transaction is 500.
 *
 * @param firestore - A reference to the Firestore database to run this
 * transaction against.
 * @param updateFunction - The function to execute within the transaction
 * context.
 * @param options - An options object to configure maximum number of attempts to
 * commit.
 * @returns If the transaction completed successfully or was explicitly aborted
 * (the `updateFunction` returned a failed promise), the promise returned by the
 * `updateFunction `is returned here. Otherwise, if the transaction failed, a
 * rejected promise with the corresponding failure error is returned.
 */ function runTransaction(t, e, n) {
    t = B(t, s);
    const r = {
        ...jt,
        ...n
    };
    !function __PRIVATE_validateTransactionOptions(t) {
        if (t.maxAttempts < 1) throw new A(S.INVALID_ARGUMENT, "Max attempts must be at least 1");
    }(r);
    const o = L(t);
    return yt(o, (n => e(new Transaction(t, n))), r);
}

/**
 * @license
 * Copyright 2020 Google LLC
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
 * Reads the document referred to by this `DocumentReference`.
 *
 * Note: `getDoc()` attempts to provide up-to-date data when possible by waiting
 * for data from the server, but it may return cached data or fail if you are
 * offline and the server cannot be reached. To specify this behavior, invoke
 * {@link getDocFromCache} or {@link getDocFromServer}.
 *
 * @param reference - The reference of the document to fetch.
 * @returns A `Promise` that resolves with a `DocumentSnapshot` containing the
 * document contents.
 */ function getDoc(t) {
    t = B(t, l);
    const e = B(t.firestore, s), n = L(e);
    return It(n, t._key).then((n => __PRIVATE_convertToDocSnapshot(e, t, n)));
}

/**
 * Reads the document referred to by this `DocumentReference` from cache.
 * Returns an error if the document is not currently cached.
 *
 * @returns A `Promise` that resolves with a `DocumentSnapshot` containing the
 * document contents.
 */ function getDocFromCache(t) {
    t = B(t, l);
    const e = B(t.firestore, s), n = L(e), r = new J(e);
    return At(n, t._key).then((n => new DocumentSnapshot(e, r, t._key, n, new SnapshotMetadata(null !== n && n.hasLocalMutations, 
    /* fromCache= */ !0), t.converter)));
}

/**
 * Reads the document referred to by this `DocumentReference` from the server.
 * Returns an error if the network is not available.
 *
 * @returns A `Promise` that resolves with a `DocumentSnapshot` containing the
 * document contents.
 */ function getDocFromServer(t) {
    t = B(t, l);
    const e = B(t.firestore, s), n = L(e);
    return It(n, t._key, {
        source: "server"
    }).then((n => __PRIVATE_convertToDocSnapshot(e, t, n)));
}

function getDocs(t) {
    t = B(t, p);
    const e = B(t.firestore, s), n = L(e), r = new J(e);
    return __PRIVATE_validateHasExplicitOrderByForLimitToLast(t._query), St(n, t._query).then((n => new QuerySnapshot(e, r, t, n)));
}

/**
 * Executes the query and returns the results as a `QuerySnapshot` from cache.
 * Returns an empty result set if no documents matching the query are currently
 * cached.
 *
 * @returns A `Promise` that resolves with the results of the query.
 */ function getDocsFromCache(t) {
    t = B(t, p);
    const e = B(t.firestore, s), n = L(e), r = new J(e);
    return Tt(n, t._query).then((n => new QuerySnapshot(e, r, t, n)));
}

/**
 * Executes the query and returns the results as a `QuerySnapshot` from the
 * server. Returns an error if the network is not available.
 *
 * @returns A `Promise` that resolves with the results of the query.
 */ function getDocsFromServer(t) {
    t = B(t, p);
    const e = B(t.firestore, s), n = L(e), r = new J(e);
    return St(n, t._query, {
        source: "server"
    }).then((n => new QuerySnapshot(e, r, t, n)));
}

function setDoc(t, e, n) {
    t = B(t, l);
    const r = B(t.firestore, s), o = __PRIVATE_applyFirestoreDataConverter(t.converter, e, n), i = m(r);
    return executeWrite(r, [ ht(i, "setDoc", t._key, o, null !== t.converter, n).toMutation(t._key, dt.none()) ]);
}

function updateDoc(t, e, n, ...r) {
    t = B(t, l);
    const o = B(t.firestore, s), i = m(o);
    let a;
    a = "string" == typeof (
    // For Compat types, we have to "extract" the underlying types before
    // performing validation.
    e = Bt(e)) || e instanceof pt ? _t(i, "updateDoc", t._key, e, n, r) : ft(i, "updateDoc", t._key, e);
    return executeWrite(o, [ a.toMutation(t._key, dt.exists(!0)) ]);
}

/**
 * Deletes the document referred to by the specified `DocumentReference`.
 *
 * Note that the returned `Promise` does _not_ resolve until the document is
 * successfully deleted from the remote Firestore backend and, similarly, is not
 * rejected until the remote Firestore backend reports an error deleting the given
 * document. So if the client cannot reach the backend (for example, due to being
 * offline) then the returned `Promise` will not resolve for a potentially-long
 * time (for example, until the client has gone back online). That being said,
 * the given data _will_ be immediately deleted from the local cache and will be
 * reflected in future "get" operations as if it had been successfully
 * deleted from the remote Firestore server, a feature of Firestore called
 * "latency compensation". The document will _eventually_ be deleted from the remote
 * Firestore backend once a connection can be established. Therefore, it is
 * usually undesirable to `await` the `Promise` returned from this function
 * because the indefinite amount of time before which the promise resolves or
 * rejects can block application logic unnecessarily.
 *
 * @param reference - A reference to the document to delete.
 * @returns A `Promise` that resolves once the document has been successfully
 * deleted from the backend or rejects once the backend reports an error
 * deleting the document.
 */ function deleteDoc(t) {
    return executeWrite(B(t.firestore, s), [ new mt(t._key, dt.none()) ]);
}

/**
 * Add a new document to specified `CollectionReference` with the given data,
 * assigning it a document ID automatically.
 *
 * Note that the returned `Promise` does _not_ resolve until the document is
 * successfully created to the remote Firestore backend and, similarly, is not
 * rejected until the remote Firestore backend reports an error creating the given
 * document. So if the client cannot reach the backend (for example, due to being
 * offline) then the returned `Promise` will not resolve for a potentially-long
 * time (for example, until the client has gone back online). That being said,
 * the given document _will_ be immediately created in the local cache and will be
 * incorporated into future "get" operations as if it had been successfully
 * created in the remote Firestore server, a feature of Firestore called
 * "latency compensation". The document will _eventually_ be created in the remote
 * Firestore backend once a connection can be established. Therefore, it is
 * usually undesirable to `await` the `Promise` returned from this function
 * because the indefinite amount of time before which the promise resolves or
 * rejects can block application logic unnecessarily.
 *
 * @param reference - A reference to the collection to add this document to.
 * @param data - An Object containing the data for the new document.
 * @returns A `Promise` that resolves once the docoument has been successfully
 * created in the backend or rejects once the backend reports an error creating
 * the document.
 */ function addDoc(t, e) {
    const n = B(t.firestore, s), r = gt(t), o = __PRIVATE_applyFirestoreDataConverter(t.converter, e), i = m(t.firestore);
    return executeWrite(n, [ ht(i, "addDoc", r._key, o, null !== t.converter, {}).toMutation(r._key, dt.exists(!1)) ]).then((() => r));
}

function onSnapshot(t, ...e) {
    // onSnapshot for Query or Document.
    t = Bt(t);
    let n = {
        includeMetadataChanges: !1,
        source: "default"
    }, r = 0;
    "object" != typeof e[r] || __PRIVATE_isPartialObserver(e[r]) || (n = e[r++]);
    const o = {
        includeMetadataChanges: n.includeMetadataChanges,
        source: n.source
    };
    if (__PRIVATE_isPartialObserver(e[r])) {
        const t = e[r];
        e[r] = t.next?.bind(t), e[r + 1] = t.error?.bind(t), e[r + 2] = t.complete?.bind(t);
    }
    let i, a, u;
    if (t instanceof l) a = B(t.firestore, s), u = Pt(t._key.path), i = {
        next: n => {
            e[r] && e[r](__PRIVATE_convertToDocSnapshot(a, t, n));
        },
        error: e[r + 1],
        complete: e[r + 2]
    }; else {
        const n = B(t, p);
        a = B(n.firestore, s), u = n._query;
        const o = new J(a);
        i = {
            next: t => {
                e[r] && e[r](new QuerySnapshot(a, o, n, t));
            },
            error: e[r + 1],
            complete: e[r + 2]
        }, __PRIVATE_validateHasExplicitOrderByForLimitToLast(t._query);
    }
    const c = L(a);
    return Et(c, u, o, i);
}

function onSnapshotResume(t, e, ...n) {
    const r = Bt(t), s = 
    /**
 * Ensures the data required to construct an {@link onSnapshot} listener exist in a `snapshotJson`
 * object that originates from {@link DocumentSnapshot.toJSON} or {@link Querysnapshot.toJSON}. The
 * data is normalized into a typed object.
 *
 * @param snapshotJson - The JSON object that the app provided to {@link onSnapshot}.
 * @returns A normalized object that contains all of the required bundle JSON fields. If
 * {@link snapshotJson} doesn't contain the required fields, or if the fields exist as empty
 * strings, then the {@link snapshotJson.error} field will be a non empty string.
 *
 * @internal
 */
    function __PRIVATE_normalizeSnapshotJsonFields(t) {
        const e = {
            bundle: "",
            bundleName: "",
            bundleSource: ""
        }, n = [ "bundle", "bundleName", "bundleSource" ];
        for (const r of n) {
            if (!(r in t)) {
                e.error = `snapshotJson missing required field: ${r}`;
                break;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const n = t[r];
            if ("string" != typeof n) {
                e.error = `snapshotJson field '${r}' must be a string.`;
                break;
            }
            if (0 === n.length) {
                e.error = `snapshotJson field '${r}' cannot be an empty string.`;
                break;
            }
            "bundle" === r ? e.bundle = n : "bundleName" === r ? e.bundleName = n : "bundleSource" === r && (e.bundleSource = n);
        }
        return e;
    }
    /**
 * Loads the bundle in a separate task and then invokes {@link onSnapshot} with a
 * {@link DocumentReference} for the document in the bundle.
 *
 * @param firestore - The {@link Firestore} instance for the {@link onSnapshot} operation request.
 * @param json - The JSON bundle to load, produced by {@link DocumentSnapshot.toJSON}.
 * @param options - Options controlling the listen behavior.
 * @param observer - A single object containing `next` and `error` callbacks.
 * @param converter - An optional object that converts objects from Firestore before the onNext
 * listener is invoked.
 * @returns An unsubscribe function that can be called to cancel the snapshot
 * listener.
 *
 * @internal
 */ (e);
    if (s.error) throw new A(S.INVALID_ARGUMENT, s.error);
    let o, i = 0;
    if ("object" != typeof n[i] || __PRIVATE_isPartialObserver(n[i]) || (o = n[i++]), 
    "QuerySnapshot" === s.bundleSource) {
        let t = null;
        if ("object" == typeof n[i] && __PRIVATE_isPartialObserver(n[i])) {
            const e = n[i++];
            t = {
                next: e.next,
                error: e.error,
                complete: e.complete
            };
        } else t = {
            next: n[i++],
            error: n[i++],
            complete: n[i++]
        };
        /**
 * Loads the bundle in a separate task and then invokes {@link onSnapshot} with a
 * {@link Query} that represents the Query in the bundle.
 *
 * @param firestore - The {@link Firestore} instance for the {@link onSnapshot} operation request.
 * @param json - The JSON bundle to load, produced by {@link QuerySnapshot.toJSON}.
 * @param options - Options controlling the listen behavior.
 * @param observer - A single object containing `next` and `error` callbacks.
 * @param converter - An optional object that converts objects from Firestore before the onNext
 * listener is invoked.
 * @returns An unsubscribe function that can be called to cancel the snapshot
 * listener.
 *
 * @internal
 */
        return function __PRIVATE_onSnapshotQuerySnapshotBundle(t, e, n, r, s) {
            let o, i = !1;
            const a = Ct(t, e.bundle);
            return a.then((() => vt(t, e.bundleName))).then((t => {
                if (t && !i) {
                    s && t.withConverter(s), o = onSnapshot(t, n || {}, r);
                }
            })).catch((t => (r.error && r.error(t), () => {}))), () => {
                i || (i = !0, o && o());
            };
        }
        /**
 * @license
 * Copyright 2020 Google LLC
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
 * Creates a write batch, used for performing multiple writes as a single
 * atomic operation. The maximum number of writes allowed in a single {@link WriteBatch}
 * is 500.
 *
 * Unlike transactions, write batches are persisted offline and therefore are
 * preferable when you don't need to condition your writes on read data.
 *
 * @returns A {@link WriteBatch} that can be used to atomically execute multiple
 * writes.
 */ (r, s, o, t, n[i]);
    }
    if ("DocumentSnapshot" === s.bundleSource) {
        let t = null;
        if ("object" == typeof n[i] && __PRIVATE_isPartialObserver(n[i])) {
            const e = n[i++];
            t = {
                next: e.next,
                error: e.error,
                complete: e.complete
            };
        } else t = {
            next: n[i++],
            error: n[i++],
            complete: n[i++]
        };
        return function __PRIVATE_onSnapshotDocumentSnapshotBundle(t, e, n, r, s) {
            let o, i = !1;
            const a = Ct(t, e.bundle);
            return a.then((() => {
                if (!i) {
                    const i = new l(t, s || null, x.fromPath(e.bundleName));
                    o = onSnapshot(i, n || {}, r);
                }
            })).catch((t => (r.error && r.error(t), () => {}))), () => {
                i || (i = !0, o && o());
            };
        }(r, s, o, t, n[i]);
    }
    throw new A(S.INVALID_ARGUMENT, `unsupported bundle source: ${s.bundleSource}`);
}

function onSnapshotsInSync(t, e) {
    t = B(t, s);
    const n = L(t), r = __PRIVATE_isPartialObserver(e) ? e : {
        next: e
    };
    return bt(n, r);
}

/**
 * Locally writes `mutations` on the async queue.
 * @internal
 */ function executeWrite(t, e) {
    const n = L(t);
    return wt(n, e);
}

/**
 * Converts a {@link ViewSnapshot} that contains the single document specified by `ref`
 * to a {@link DocumentSnapshot}.
 */ function __PRIVATE_convertToDocSnapshot(t, e, n) {
    const r = n.docs.get(e._key), s = new J(t);
    return new DocumentSnapshot(t, s, e._key, r, new SnapshotMetadata(n.hasPendingWrites, n.fromCache), e.converter);
}

function writeBatch(t) {
    return t = B(t, s), L(t), new WriteBatch(t, (e => executeWrite(t, e)));
}

/**
 * @license
 * Copyright 2021 Google LLC
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
 */ function setIndexConfiguration(t, e) {
    t = B(t, s);
    const n = L(t);
    if (!n._uninitializedComponentsProvider || "memory" === n._uninitializedComponentsProvider._offline.kind) 
    // PORTING NOTE: We don't return an error if the user has not enabled
    // persistence since `enableIndexeddbPersistence()` can fail on the Web.
    return Rt("Cannot enable indexes when persistence is disabled"), Promise.resolve();
    const r = function __PRIVATE_parseIndexes(t) {
        const e = "string" == typeof t ? function __PRIVATE_tryParseJson(t) {
            try {
                return JSON.parse(t);
            } catch (t) {
                throw new A(S.INVALID_ARGUMENT, "Failed to parse JSON: " + t?.message);
            }
        }(t) : t, n = [];
        if (Array.isArray(e.indexes)) for (const t of e.indexes) {
            const e = __PRIVATE_tryGetString(t, "collectionGroup"), r = [];
            if (Array.isArray(t.fields)) for (const e of t.fields) {
                const t = __PRIVATE_tryGetString(e, "fieldPath"), n = Vt("setIndexConfiguration", t);
                "CONTAINS" === e.arrayConfig ? r.push(new xt(n, 2 /* IndexKind.CONTAINS */)) : "ASCENDING" === e.order ? r.push(new xt(n, 0 /* IndexKind.ASCENDING */)) : "DESCENDING" === e.order && r.push(new xt(n, 1 /* IndexKind.DESCENDING */));
            }
            n.push(new Dt(Dt.UNKNOWN_ID, e, r, Qt.empty()));
        }
        return n;
    }(e);
    return Ft(n, r);
}

function __PRIVATE_tryGetString(t, e) {
    if ("string" != typeof t[e]) throw new A(S.INVALID_ARGUMENT, "Missing string value for: " + e);
    return t[e];
}

/**
 * @license
 * Copyright 2023 Google LLC
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
 * A `PersistentCacheIndexManager` for configuring persistent cache indexes used
 * for local query execution.
 *
 * To use, call `getPersistentCacheIndexManager()` to get an instance.
 */ class PersistentCacheIndexManager {
    /** @hideconstructor */
    constructor(t) {
        this._firestore = t, 
        /** A type string to uniquely identify instances of this class. */
        this.type = "PersistentCacheIndexManager";
    }
}

/**
 * Returns the PersistentCache Index Manager used by the given `Firestore`
 * object.
 *
 * @returns The `PersistentCacheIndexManager` instance, or `null` if local
 * persistent storage is not in use.
 */ function getPersistentCacheIndexManager(t) {
    t = B(t, s);
    const e = Ht.get(t);
    if (e) return e;
    const n = L(t);
    if ("persistent" !== n._uninitializedComponentsProvider?._offline.kind) return null;
    const r = new PersistentCacheIndexManager(t);
    return Ht.set(t, r), r;
}

/**
 * Enables the SDK to create persistent cache indexes automatically for local
 * query execution when the SDK believes cache indexes can help improve
 * performance.
 *
 * This feature is disabled by default.
 */ function enablePersistentCacheIndexAutoCreation(t) {
    __PRIVATE_setPersistentCacheIndexAutoCreationEnabled(t, !0);
}

/**
 * Stops creating persistent cache indexes automatically for local query
 * execution. The indexes which have been created by calling
 * `enablePersistentCacheIndexAutoCreation()` still take effect.
 */ function disablePersistentCacheIndexAutoCreation(t) {
    __PRIVATE_setPersistentCacheIndexAutoCreationEnabled(t, !1);
}

/**
 * Removes all persistent cache indexes.
 *
 * Please note this function will also deletes indexes generated by
 * `setIndexConfiguration()`, which is deprecated.
 */ function deleteAllPersistentCacheIndexes(t) {
    const e = L(t._firestore);
    Ot(e).then((t => qt("deleting all persistent cache indexes succeeded"))).catch((t => Rt("deleting all persistent cache indexes failed", t)));
}

function __PRIVATE_setPersistentCacheIndexAutoCreationEnabled(t, e) {
    const n = L(t._firestore);
    Mt(n, e).then((t => qt(`setting persistent cache index auto creation isEnabled=${e} succeeded`))).catch((t => Rt(`setting persistent cache index auto creation isEnabled=${e} failed`, t)));
}

/**
 * Maps `Firestore` instances to their corresponding
 * `PersistentCacheIndexManager` instances.
 *
 * Use a `WeakMap` so that the mapping will be automatically dropped when the
 * `Firestore` instance is garbage collected. This emulates a private member
 * as described in https://goo.gle/454yvug.
 */ const Ht = new WeakMap;

/**
 * @license
 * Copyright 2023 Google LLC
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
 * Testing hooks for use by Firestore's integration test suite to reach into the
 * SDK internals to validate logic and behavior that is not visible from the
 * public API surface.
 *
 * @internal
 */ class TestingHooks {
    constructor() {
        throw new Error("instances of this class should not be created");
    }
    /**
     * Registers a callback to be notified when an existence filter mismatch
     * occurs in the Watch listen stream.
     *
     * The relative order in which callbacks are notified is unspecified; do not
     * rely on any particular ordering. If a given callback is registered multiple
     * times then it will be notified multiple times, once per registration.
     *
     * @param callback - the callback to invoke upon existence filter mismatch.
     *
     * @returns a function that, when called, unregisters the given callback; only
     * the first invocation of the returned function does anything; all subsequent
     * invocations do nothing.
     */    static onExistenceFilterMismatch(t) {
        return __PRIVATE_TestingHooksSpiImpl.instance.onExistenceFilterMismatch(t);
    }
}

/**
 * The implementation of `TestingHooksSpi`.
 */ class __PRIVATE_TestingHooksSpiImpl {
    constructor() {
        this.i = new Map;
    }
    static get instance() {
        return Yt || (Yt = new __PRIVATE_TestingHooksSpiImpl, Nt(Yt)), Yt;
    }
    Ie(t) {
        this.i.forEach((e => e(t)));
    }
    onExistenceFilterMismatch(t) {
        const e = Symbol(), n = this.i;
        return n.set(e, t), () => n.delete(e);
    }
}

let Yt = null;

/**
 * @license
 * Copyright 2021 Google LLC
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
 */ !
/**
 * @license
 * Copyright 2020 Google LLC
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
function __PRIVATE_registerFirestore(c, l = !0) {
    u(n), t(new r("firestore", ((t, {instanceIdentifier: e, options: n}) => {
        const r = t.getProvider("app").getImmediate(), u = new s(new o(t.getProvider("auth-internal")), new i(r, t.getProvider("app-check-internal")), a(r, e), r);
        return n = {
            useFetchStreams: l,
            ...n
        }, u._setSettings(n), u;
    }), "PUBLIC").setMultipleInstances(!0)), e(Wt, $t, c), 
    // BUILD_TARGET will be replaced by values like esm, cjs, etc during the compilation
    e(Wt, $t, "esm2020");
}("rn", /* useFetchStreams= */ !1);

export { q as AbstractUserDataWriter, AggregateField, AggregateQuerySnapshot, M as Bytes, l as DocumentReference, DocumentSnapshot, pt as FieldPath, s as Firestore, A as FirestoreError, PersistentCacheIndexManager, p as Query, QueryCompositeFilterConstraint, QueryConstraint, QueryDocumentSnapshot, QueryEndAtConstraint, QueryFieldFilterConstraint, QueryLimitConstraint, QueryOrderByConstraint, QuerySnapshot, QueryStartAtConstraint, SnapshotMetadata, Transaction, WriteBatch, z as _AutoId, x as _DocumentKey, TestingHooks as _TestingHooks, B as _cast, Rt as _logWarn, addDoc, aggregateFieldEqual, aggregateQuerySnapshotEqual, and, average, count, deleteAllPersistentCacheIndexes, deleteDoc, disablePersistentCacheIndexAutoCreation, gt as doc, documentSnapshotFromJSON, enablePersistentCacheIndexAutoCreation, endAt, endBefore, L as ensureFirestoreConfigured, executeWrite, getAggregateFromServer, getCountFromServer, getDoc, getDocFromCache, getDocFromServer, getDocs, getDocsFromCache, getDocsFromServer, getPersistentCacheIndexManager, limit, limitToLast, Ct as loadBundle, memoryEagerGarbageCollector, memoryLocalCache, memoryLruGarbageCollector, vt as namedQuery, onSnapshot, onSnapshotResume, onSnapshotsInSync, or, orderBy, persistentLocalCache, persistentMultipleTabManager, persistentSingleTabManager, query, N as queryEqual, querySnapshotFromJSON, runTransaction, setDoc, setIndexConfiguration, snapshotEqual, startAfter, startAt, sum, updateDoc, where, writeBatch };
//# sourceMappingURL=index.rn.js.map
