'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('@firebase/installations');
var component = require('@firebase/component');
var idb = require('idb');
var util = require('@firebase/util');
var app = require('@firebase/app');

/**
 * @license
 * Copyright 2019 Google LLC
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
const DEFAULT_VAPID_KEY = 'BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4';
const ENDPOINT = 'https://fcmregistrations.googleapis.com/v1';
/** Key of FCM Payload in Notification's data field. */
const FCM_MSG = 'FCM_MSG';
const CONSOLE_CAMPAIGN_ID = 'google.c.a.c_id';
const MAX_NUMBER_OF_EVENTS_PER_LOG_REQUEST = 1000;
const MAX_RETRIES = 3;
const LOG_INTERVAL_IN_MS = 86400000; //24 hour
const DEFAULT_BACKOFF_TIME_MS = 5000;
// FCM log source name registered at Firelog: 'FCM_CLIENT_EVENT_LOGGING'. It uniquely identifies
// FCM's logging configuration.
const FCM_LOG_SOURCE = 1249;
// Defined as in proto/messaging_event.proto. Neglecting fields that are supported.
const SDK_PLATFORM_WEB = 3;
const EVENT_MESSAGE_DELIVERED = 1;
var MessageType$1;
(function (MessageType) {
    MessageType[MessageType["DATA_MESSAGE"] = 1] = "DATA_MESSAGE";
    MessageType[MessageType["DISPLAY_NOTIFICATION"] = 3] = "DISPLAY_NOTIFICATION";
})(MessageType$1 || (MessageType$1 = {}));

/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */
var MessageType;
(function (MessageType) {
    MessageType["PUSH_RECEIVED"] = "push-received";
    MessageType["NOTIFICATION_CLICKED"] = "notification-clicked";
    MessageType["FID_REGISTERED"] = "fid-registered";
})(MessageType || (MessageType = {}));

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
 */
function arrayToBase64(array) {
    const uint8Array = new Uint8Array(array);
    const base64String = btoa(String.fromCharCode(...uint8Array));
    return base64String.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function base64ToArray(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * @license
 * Copyright 2019 Google LLC
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
const OLD_DB_NAME = 'fcm_token_details_db';
/**
 * The last DB version of 'fcm_token_details_db' was 4. This is one higher, so that the upgrade
 * callback is called for all versions of the old DB.
 */
const OLD_DB_VERSION = 5;
const OLD_OBJECT_STORE_NAME = 'fcm_token_object_Store';
async function migrateOldDatabase(senderId) {
    if ('databases' in indexedDB) {
        // indexedDb.databases() is an IndexedDB v3 API and does not exist in all browsers. TODO: Remove
        // typecast when it lands in TS types.
        const databases = await indexedDB.databases();
        const dbNames = databases.map(db => db.name);
        if (!dbNames.includes(OLD_DB_NAME)) {
            // old DB didn't exist, no need to open.
            return null;
        }
    }
    let tokenDetails = null;
    const db = await idb.openDB(OLD_DB_NAME, OLD_DB_VERSION, {
        upgrade: async (db, oldVersion, newVersion, upgradeTransaction) => {
            if (oldVersion < 2) {
                // Database too old, skip migration.
                return;
            }
            if (!db.objectStoreNames.contains(OLD_OBJECT_STORE_NAME)) {
                // Database did not exist. Nothing to do.
                return;
            }
            const objectStore = upgradeTransaction.objectStore(OLD_OBJECT_STORE_NAME);
            const value = await objectStore.index('fcmSenderId').get(senderId);
            await objectStore.clear();
            if (!value) {
                // No entry in the database, nothing to migrate.
                return;
            }
            if (oldVersion === 2) {
                const oldDetails = value;
                if (!oldDetails.auth || !oldDetails.p256dh || !oldDetails.endpoint) {
                    return;
                }
                tokenDetails = {
                    token: oldDetails.fcmToken,
                    createTime: oldDetails.createTime ?? Date.now(),
                    subscriptionOptions: {
                        auth: oldDetails.auth,
                        p256dh: oldDetails.p256dh,
                        endpoint: oldDetails.endpoint,
                        swScope: oldDetails.swScope,
                        vapidKey: typeof oldDetails.vapidKey === 'string'
                            ? oldDetails.vapidKey
                            : arrayToBase64(oldDetails.vapidKey)
                    }
                };
            }
            else if (oldVersion === 3) {
                const oldDetails = value;
                tokenDetails = {
                    token: oldDetails.fcmToken,
                    createTime: oldDetails.createTime,
                    subscriptionOptions: {
                        auth: arrayToBase64(oldDetails.auth),
                        p256dh: arrayToBase64(oldDetails.p256dh),
                        endpoint: oldDetails.endpoint,
                        swScope: oldDetails.swScope,
                        vapidKey: arrayToBase64(oldDetails.vapidKey)
                    }
                };
            }
            else if (oldVersion === 4) {
                const oldDetails = value;
                tokenDetails = {
                    token: oldDetails.fcmToken,
                    createTime: oldDetails.createTime,
                    subscriptionOptions: {
                        auth: arrayToBase64(oldDetails.auth),
                        p256dh: arrayToBase64(oldDetails.p256dh),
                        endpoint: oldDetails.endpoint,
                        swScope: oldDetails.swScope,
                        vapidKey: arrayToBase64(oldDetails.vapidKey)
                    }
                };
            }
        }
    });
    db.close();
    // Delete all old databases.
    await idb.deleteDB(OLD_DB_NAME);
    await idb.deleteDB('fcm_vapid_details_db');
    await idb.deleteDB('undefined');
    return checkTokenDetails(tokenDetails) ? tokenDetails : null;
}
function checkTokenDetails(tokenDetails) {
    if (!tokenDetails || !tokenDetails.subscriptionOptions) {
        return false;
    }
    const { subscriptionOptions } = tokenDetails;
    return (typeof tokenDetails.createTime === 'number' &&
        tokenDetails.createTime > 0 &&
        typeof tokenDetails.token === 'string' &&
        tokenDetails.token.length > 0 &&
        typeof subscriptionOptions.auth === 'string' &&
        subscriptionOptions.auth.length > 0 &&
        typeof subscriptionOptions.p256dh === 'string' &&
        subscriptionOptions.p256dh.length > 0 &&
        typeof subscriptionOptions.endpoint === 'string' &&
        subscriptionOptions.endpoint.length > 0 &&
        typeof subscriptionOptions.swScope === 'string' &&
        subscriptionOptions.swScope.length > 0 &&
        typeof subscriptionOptions.vapidKey === 'string' &&
        subscriptionOptions.vapidKey.length > 0);
}

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
 */
const ERROR_MAP = {
    ["missing-app-config-values" /* ErrorCode.MISSING_APP_CONFIG_VALUES */]: 'Missing App configuration value: "{$valueName}"',
    ["only-available-in-window" /* ErrorCode.AVAILABLE_IN_WINDOW */]: 'This method is available in a Window context.',
    ["only-available-in-sw" /* ErrorCode.AVAILABLE_IN_SW */]: 'This method is available in a service worker context.',
    ["permission-default" /* ErrorCode.PERMISSION_DEFAULT */]: 'The notification permission was not granted and dismissed instead.',
    ["permission-blocked" /* ErrorCode.PERMISSION_BLOCKED */]: 'The notification permission was not granted and blocked instead.',
    ["unsupported-browser" /* ErrorCode.UNSUPPORTED_BROWSER */]: "This browser doesn't support the API's required to use the Firebase SDK.",
    ["indexed-db-unsupported" /* ErrorCode.INDEXED_DB_UNSUPPORTED */]: "This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)",
    ["failed-service-worker-registration" /* ErrorCode.FAILED_DEFAULT_REGISTRATION */]: 'We are unable to register the default service worker. {$browserErrorMessage}',
    ["token-subscribe-failed" /* ErrorCode.TOKEN_SUBSCRIBE_FAILED */]: 'A problem occurred while subscribing the user to FCM: {$errorInfo}',
    ["token-subscribe-no-token" /* ErrorCode.TOKEN_SUBSCRIBE_NO_TOKEN */]: 'FCM returned no token when subscribing the user to push.',
    ["fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */]: 'A problem occurred while creating an FCM registration via FID: {$errorInfo}',
    ["fid-unregister-failed" /* ErrorCode.FID_UNREGISTER_FAILED */]: 'A problem occurred while unregistering the FCM registration via FID: {$errorInfo}',
    ["fid-registration-idb-schema-unavailable" /* ErrorCode.FID_REGISTRATION_IDB_SCHEMA_UNAVAILABLE */]: 'Unable to read or persist FID registration metadata because the messaging ' +
        'IndexedDB schema is unavailable (for example, the database could not be ' +
        'upgraded to the latest version).',
    ["token-unsubscribe-failed" /* ErrorCode.TOKEN_UNSUBSCRIBE_FAILED */]: 'A problem occurred while unsubscribing the ' +
        'user from FCM: {$errorInfo}',
    ["token-update-failed" /* ErrorCode.TOKEN_UPDATE_FAILED */]: 'A problem occurred while updating the user from FCM: {$errorInfo}',
    ["token-update-no-token" /* ErrorCode.TOKEN_UPDATE_NO_TOKEN */]: 'FCM returned no token when updating the user to push.',
    ["use-sw-after-get-token" /* ErrorCode.USE_SW_AFTER_GET_TOKEN */]: 'The useServiceWorker() method may only be called once and must be ' +
        'called before calling getToken() to ensure your service worker is used.',
    ["invalid-sw-registration" /* ErrorCode.INVALID_SW_REGISTRATION */]: 'The input to useServiceWorker() must be a ServiceWorkerRegistration.',
    ["invalid-bg-handler" /* ErrorCode.INVALID_BG_HANDLER */]: 'The input to setBackgroundMessageHandler() must be a function.',
    ["invalid-vapid-key" /* ErrorCode.INVALID_VAPID_KEY */]: 'The public VAPID key must be a string.',
    ["use-vapid-key-after-get-token" /* ErrorCode.USE_VAPID_KEY_AFTER_GET_TOKEN */]: 'The usePublicVapidKey() method may only be called once and must be ' +
        'called before calling getToken() to ensure your VAPID key is used.',
    ["invalid-on-registered-handler" /* ErrorCode.INVALID_ON_REGISTERED_HANDLER */]: 'No onRegistered callback handler was provided or registered. Implement onRegistered() before register().'
};
const ERROR_FACTORY = new util.ErrorFactory('messaging', 'Messaging', ERROR_MAP);

/**
 * @license
 * Copyright 2019 Google LLC
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
const DATABASE_NAME = 'firebase-messaging-database';
const DATABASE_VERSION = 2;
const TOKEN_OBJECT_STORE_NAME = 'firebase-messaging-store';
const FID_REGISTRATION_OBJECT_STORE_NAME = 'firebase-messaging-fid-registration-store';
const defaultIdb = { openDB: idb.openDB, deleteDB: idb.deleteDB };
let idbImpl = defaultIdb;
// Open v2, but fall back to v1 if upgrade/open fails. Cache as `unknown` and guard store access.
let dbPromise = null;
function migrateMessagingDb(upgradeDb, oldVersion, targetSchemaVersion) {
    // Intentional fall-through for v2: run all intermediate migrations.
    // eslint-disable-next-line default-case
    switch (oldVersion) {
        case 0:
            upgradeDb.createObjectStore(TOKEN_OBJECT_STORE_NAME);
            if (targetSchemaVersion === 1) {
                break;
            }
        // fall through
        case 1:
            if (targetSchemaVersion === 2) {
                upgradeDb.createObjectStore(FID_REGISTRATION_OBJECT_STORE_NAME);
            }
    }
}
function createOpenDbOptions(targetSchemaVersion) {
    return {
        upgrade: (upgradeDb, oldVersion) => {
            migrateMessagingDb(upgradeDb, oldVersion, targetSchemaVersion);
        },
        blocked: () => {
            /* no-op */
        },
        blocking: (_currentVersion, _blockedVersion, event) => {
            dbPromise = null;
            event.target?.close();
        },
        terminated: () => {
            dbPromise = null;
        }
    };
}
function getDbPromise() {
    if (!dbPromise) {
        const openLatest = idbImpl.openDB(DATABASE_NAME, DATABASE_VERSION, createOpenDbOptions(2));
        // Assign synchronously to avoid concurrent openDB() calls.
        dbPromise = openLatest.catch(() => idbImpl.openDB(DATABASE_NAME, DATABASE_VERSION - 1, createOpenDbOptions(1)));
    }
    return dbPromise;
}
function hasObjectStore(db, storeName) {
    return db.objectStoreNames.contains(storeName);
}
function assertFidRegistrationObjectStore(db) {
    if (!hasObjectStore(db, FID_REGISTRATION_OBJECT_STORE_NAME)) {
        throw ERROR_FACTORY.create("fid-registration-idb-schema-unavailable" /* ErrorCode.FID_REGISTRATION_IDB_SCHEMA_UNAVAILABLE */);
    }
}
async function dbGet(firebaseDependencies) {
    const key = getKey(firebaseDependencies);
    const db = await getDbPromise();
    const tokenDetails = (await db
        .transaction(TOKEN_OBJECT_STORE_NAME)
        .objectStore(TOKEN_OBJECT_STORE_NAME)
        .get(key));
    if (tokenDetails) {
        return tokenDetails;
    }
    else {
        const oldTokenDetails = await migrateOldDatabase(firebaseDependencies.appConfig.senderId);
        if (oldTokenDetails) {
            await dbSet(firebaseDependencies, oldTokenDetails);
            return oldTokenDetails;
        }
    }
}
async function dbSet(firebaseDependencies, tokenDetails) {
    const key = getKey(firebaseDependencies);
    const db = await getDbPromise();
    const stores = [TOKEN_OBJECT_STORE_NAME];
    const hasFidStore = hasObjectStore(db, FID_REGISTRATION_OBJECT_STORE_NAME);
    if (hasFidStore) {
        stores.push(FID_REGISTRATION_OBJECT_STORE_NAME);
    }
    const tx = db.transaction(stores, 'readwrite');
    await tx.objectStore(TOKEN_OBJECT_STORE_NAME).put(tokenDetails, key);
    if (hasFidStore) {
        await tx.objectStore(FID_REGISTRATION_OBJECT_STORE_NAME).delete(key);
    }
    await tx.done;
    return tokenDetails;
}
async function dbRemove(firebaseDependencies) {
    const key = getKey(firebaseDependencies);
    const db = await getDbPromise();
    const tx = db.transaction(TOKEN_OBJECT_STORE_NAME, 'readwrite');
    await tx.objectStore(TOKEN_OBJECT_STORE_NAME).delete(key);
    await tx.done;
}
async function dbGetFidRegistration(firebaseDependencies) {
    const key = getKey(firebaseDependencies);
    const db = await getDbPromise();
    assertFidRegistrationObjectStore(db);
    return (await db
        .transaction(FID_REGISTRATION_OBJECT_STORE_NAME)
        .objectStore(FID_REGISTRATION_OBJECT_STORE_NAME)
        .get(key));
}
async function dbSetFidRegistration(firebaseDependencies, details) {
    const key = getKey(firebaseDependencies);
    const db = await getDbPromise();
    assertFidRegistrationObjectStore(db);
    const tx = db.transaction([TOKEN_OBJECT_STORE_NAME, FID_REGISTRATION_OBJECT_STORE_NAME], 'readwrite');
    await tx.objectStore(FID_REGISTRATION_OBJECT_STORE_NAME).put(details, key);
    await tx.objectStore(TOKEN_OBJECT_STORE_NAME).delete(key);
    await tx.done;
    return details;
}
async function dbRemoveFidRegistration(firebaseDependencies) {
    const key = getKey(firebaseDependencies);
    const db = await getDbPromise();
    assertFidRegistrationObjectStore(db);
    const tx = db.transaction(FID_REGISTRATION_OBJECT_STORE_NAME, 'readwrite');
    await tx.objectStore(FID_REGISTRATION_OBJECT_STORE_NAME).delete(key);
    await tx.done;
}
function getKey({ appConfig }) {
    return appConfig.appId;
}

const version = "0.13.1";

/**
 * @license
 * Copyright 2019 Google LLC
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
/** Max attempts (initial fetch + retries) when CreateRegistration `fetch()` throws. */
const FID_REGISTRATION_FETCH_MAX_ATTEMPTS = 3;
/** Base delay in ms; backoff is `BASE * 2^attempt` after each failed attempt. */
const FID_REGISTRATION_FETCH_BASE_BACKOFF_MS = 1000;
async function requestGetToken(firebaseDependencies, subscriptionOptions) {
    const headers = await getHeaders(firebaseDependencies);
    const body = getBody(subscriptionOptions, firebaseDependencies.appConfig.appName, 
    /* includeSdkVersion= */ false);
    const subscribeOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    };
    let responseData;
    try {
        const response = await fetch(getEndpoint(firebaseDependencies.appConfig), subscribeOptions);
        responseData = await response.json();
    }
    catch (err) {
        throw ERROR_FACTORY.create("token-subscribe-failed" /* ErrorCode.TOKEN_SUBSCRIBE_FAILED */, {
            errorInfo: err?.toString()
        });
    }
    if (responseData.error) {
        const message = responseData.error.message;
        throw ERROR_FACTORY.create("token-subscribe-failed" /* ErrorCode.TOKEN_SUBSCRIBE_FAILED */, {
            errorInfo: message
        });
    }
    if (!responseData.token) {
        throw ERROR_FACTORY.create("token-subscribe-no-token" /* ErrorCode.TOKEN_SUBSCRIBE_NO_TOKEN */);
    }
    return responseData.token;
}
async function requestCreateRegistration(firebaseDependencies, subscriptionOptions) {
    const headers = await getHeaders(firebaseDependencies);
    const body = getBody(subscriptionOptions, firebaseDependencies.appConfig.appName, 
    /* includeSdkVersion= */ true);
    const subscribeOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    };
    let response;
    try {
        response = await fetchWithExponentialRetry(() => fetch(getEndpoint(firebaseDependencies.appConfig), subscribeOptions), FID_REGISTRATION_FETCH_MAX_ATTEMPTS, FID_REGISTRATION_FETCH_BASE_BACKOFF_MS);
    }
    catch (err) {
        throw ERROR_FACTORY.create("fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */, {
            errorInfo: err?.toString()
        });
    }
    if (response.ok) {
        const responseFid = await parseCreateRegistrationSuccessFid(response);
        return { responseFid };
    }
    // `fetch()` succeeded, but the backend returned a non-2xx response.
    // Best-effort parse the body to extract `error.message`, but always fail with
    // `FID_REGISTRATION_FAILED` to keep the error surface uniform.
    // Best-effort extraction of error details; the main signal is response.ok / status.
    let responseData;
    try {
        responseData = (await response.json());
    }
    catch (err) {
        throw ERROR_FACTORY.create("fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */, {
            errorInfo: response.statusText
        });
    }
    const message = responseData.error?.message ?? response.statusText;
    throw ERROR_FACTORY.create("fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */, {
        errorInfo: message
    });
}
/**
 * Deletes an FCM Web registration via DeleteRegistration using the Firebase Installation ID (FID).
 */
async function requestDeleteRegistration(firebaseDependencies, fid) {
    const headers = await getHeaders(firebaseDependencies);
    const options = {
        method: 'DELETE',
        headers
    };
    let response;
    try {
        response = await fetch(`${getEndpoint(firebaseDependencies.appConfig)}/${fid}`, options);
    }
    catch (err) {
        throw ERROR_FACTORY.create("fid-unregister-failed" /* ErrorCode.FID_UNREGISTER_FAILED */, {
            errorInfo: err?.toString()
        });
    }
    if (response.ok) {
        return;
    }
    // Best-effort parse error details; surface uniform error code.
    try {
        const responseData = (await response.json());
        const message = responseData.error?.message ?? response.statusText;
        throw message;
    }
    catch (err) {
        // If parsing failed, fall back to status text.
        throw ERROR_FACTORY.create("fid-unregister-failed" /* ErrorCode.FID_UNREGISTER_FAILED */, {
            errorInfo: (typeof err === 'string' && err) ||
                response.statusText ||
                err?.toString()
        });
    }
}
/**
 * Parses a successful CreateRegistration body. The backend must return JSON with a non-empty
 * string `name`: a resource name `projects/{projectId}/registrations/{fid}`
 */
async function parseCreateRegistrationSuccessFid(response) {
    const text = await response.text();
    if (!text.trim()) {
        throw ERROR_FACTORY.create("fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */, {
            errorInfo: 'CreateRegistration succeeded but response body is empty'
        });
    }
    let data;
    try {
        data = JSON.parse(text);
    }
    catch {
        throw ERROR_FACTORY.create("fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */, {
            errorInfo: 'CreateRegistration succeeded but response body is not valid JSON'
        });
    }
    const name = data.name;
    if (typeof name !== 'string' || name.length === 0) {
        throw ERROR_FACTORY.create("fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */, {
            errorInfo: 'CreateRegistration succeeded but response did not include a non-empty name'
        });
    }
    return parseFidFromRegistrationResourceName(name);
}
const REGISTRATIONS_NAME_SEGMENT = '/registrations/';
/** Extracts the Firebase Installation ID from CreateRegistration `name` (resource path). */
function parseFidFromRegistrationResourceName(name) {
    const segmentIndex = name.indexOf(REGISTRATIONS_NAME_SEGMENT);
    if (segmentIndex !== -1) {
        const fid = name.slice(segmentIndex + REGISTRATIONS_NAME_SEGMENT.length);
        if (fid.length > 0) {
            return fid;
        }
    }
    throw ERROR_FACTORY.create("fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */, {
        errorInfo: 'CreateRegistration succeeded but response name is not a valid registration resource name'
    });
}
async function requestUpdateToken(firebaseDependencies, tokenDetails) {
    const headers = await getHeaders(firebaseDependencies);
    const body = getBody(tokenDetails.subscriptionOptions, firebaseDependencies.appConfig.appName, 
    /* includeSdkVersion= */ false);
    const updateOptions = {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
    };
    let responseData;
    try {
        const response = await fetch(`${getEndpoint(firebaseDependencies.appConfig)}/${tokenDetails.token}`, updateOptions);
        responseData = await response.json();
    }
    catch (err) {
        throw ERROR_FACTORY.create("token-update-failed" /* ErrorCode.TOKEN_UPDATE_FAILED */, {
            errorInfo: err?.toString()
        });
    }
    if (responseData.error) {
        const message = responseData.error.message;
        throw ERROR_FACTORY.create("token-update-failed" /* ErrorCode.TOKEN_UPDATE_FAILED */, {
            errorInfo: message
        });
    }
    if (!responseData.token) {
        throw ERROR_FACTORY.create("token-update-no-token" /* ErrorCode.TOKEN_UPDATE_NO_TOKEN */);
    }
    return responseData.token;
}
async function requestDeleteToken(firebaseDependencies, token) {
    const headers = await getHeaders(firebaseDependencies);
    const unsubscribeOptions = {
        method: 'DELETE',
        headers
    };
    try {
        const response = await fetch(`${getEndpoint(firebaseDependencies.appConfig)}/${token}`, unsubscribeOptions);
        const responseData = await response.json();
        if (responseData.error) {
            const message = responseData.error.message;
            throw ERROR_FACTORY.create("token-unsubscribe-failed" /* ErrorCode.TOKEN_UNSUBSCRIBE_FAILED */, {
                errorInfo: message
            });
        }
    }
    catch (err) {
        throw ERROR_FACTORY.create("token-unsubscribe-failed" /* ErrorCode.TOKEN_UNSUBSCRIBE_FAILED */, {
            errorInfo: err?.toString()
        });
    }
}
/**
 * Re-runs `operation` when it throws, with exponential backoff between attempts.
 * Rethrows the last error if all attempts fail.
 */
async function fetchWithExponentialRetry(operation, maxAttempts, baseBackoffMs) {
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (err) {
            lastError = err;
            if (attempt < maxAttempts - 1) {
                const delayMs = baseBackoffMs * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}
function getEndpoint({ projectId }) {
    return `${ENDPOINT}/projects/${projectId}/registrations`;
}
async function getHeaders({ appConfig, installations }) {
    const authToken = await installations.getToken();
    return new Headers({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goog-api-key': appConfig.apiKey,
        'x-goog-firebase-installations-auth': `FIS ${authToken}`
    });
}
/**
 * Hostname for the registering web client (e.g. `www.example.com`), or the app name
 * (`appNameFallback`) when the scope cannot be resolved (e.g. some test environments).
 */
function getRegistrationOrigin(swScope, appNameFallback) {
    try {
        if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(swScope)) {
            return new URL(swScope).host;
        }
    }
    catch {
        // Fall through to relative-scope handling.
    }
    try {
        if (typeof self !== 'undefined' && self.location?.href) {
            return new URL(swScope, self.location.origin).host;
        }
    }
    catch {
        // Fall through.
    }
    if (typeof self !== 'undefined' && self.location?.host) {
        return self.location.host;
    }
    return appNameFallback;
}
function getBody({ p256dh, auth, endpoint, vapidKey, swScope }, appNameFallback, includeSdkVersion) {
    const body = {
        web: {
            origin: getRegistrationOrigin(swScope, appNameFallback),
            endpoint,
            auth,
            p256dh
        }
    };
    if (includeSdkVersion) {
        // eslint-disable-next-line camelcase
        body.fcm_sdk_version = version;
    }
    if (vapidKey !== DEFAULT_VAPID_KEY) {
        body.web.applicationPubKey = vapidKey;
    }
    return body;
}

/**
 * @license
 * Copyright 2019 Google LLC
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
// UpdateRegistration will be called once every week.
const TOKEN_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
async function getTokenInternal(messaging) {
    const pushSubscription = await getPushSubscription$1(messaging.swRegistration, messaging.vapidKey);
    const subscriptionOptions = {
        vapidKey: messaging.vapidKey,
        swScope: messaging.swRegistration.scope,
        endpoint: pushSubscription.endpoint,
        auth: arrayToBase64(pushSubscription.getKey('auth')),
        p256dh: arrayToBase64(pushSubscription.getKey('p256dh'))
    };
    const tokenDetails = await dbGet(messaging.firebaseDependencies);
    if (!tokenDetails) {
        // No token, get a new one.
        return getNewToken(messaging.firebaseDependencies, subscriptionOptions);
    }
    else if (!isTokenValid(tokenDetails.subscriptionOptions, subscriptionOptions)) {
        // Invalid token, get a new one.
        try {
            await requestDeleteToken(messaging.firebaseDependencies, tokenDetails.token);
        }
        catch (e) {
            // Suppress errors because of #2364
            console.warn(e);
        }
        return getNewToken(messaging.firebaseDependencies, subscriptionOptions);
    }
    else if (Date.now() >= tokenDetails.createTime + TOKEN_EXPIRATION_MS) {
        // Weekly token refresh
        return updateToken(messaging, {
            token: tokenDetails.token,
            createTime: Date.now(),
            subscriptionOptions
        });
    }
    else {
        // Valid token, nothing to do.
        return tokenDetails.token;
    }
}
/**
 * Legacy getToken() path: there is a token row in IndexedDB. Revoke it with FCM, drop the row, and
 * clear any leftover FID registration metadata (apps may mix APIs).
 */
async function revokeLegacyFcmTokenAndClearCaches(messaging, tokenDetails) {
    await requestDeleteToken(messaging.firebaseDependencies, tokenDetails.token);
    await dbRemove(messaging.firebaseDependencies);
    await removeFidRegistrationBestEffort(messaging.firebaseDependencies);
}
/**
 * No legacy token row: the client may only have FID-based registration (register() flow). If so,
 * delete that registration on the server, always scrub local FID metadata, then surface
 * onUnregistered when we actually had an FID.
 */
async function revokeFidRegistrationIfStored(messaging) {
    const stored = await dbGetFidRegistration(messaging.firebaseDependencies).catch(() => undefined);
    const fid = stored?.fid;
    if (fid) {
        await requestDeleteRegistration(messaging.firebaseDependencies, fid);
    }
    await removeFidRegistrationBestEffort(messaging.firebaseDependencies);
    if (fid) {
        notifyOnUnregistered(messaging, fid);
    }
}
/**
 * Revokes the app's FCM registration: legacy token (getToken/deleteToken) and/or FID-based
 * registration (register/unregister), clears local caches, notifies onUnregistered when a stored
 * FID existed, then unsubscribes the push subscription when present.
 */
async function revokeRegistrationInternal(messaging) {
    const tokenDetails = await dbGet(messaging.firebaseDependencies);
    if (tokenDetails) {
        await revokeLegacyFcmTokenAndClearCaches(messaging, tokenDetails);
    }
    else {
        await revokeFidRegistrationIfStored(messaging);
    }
    // Unsubscribe from the push subscription.
    const pushSubscription = await messaging.swRegistration.pushManager.getSubscription();
    if (pushSubscription) {
        return pushSubscription.unsubscribe();
    }
    // If there's no SW, consider it a success.
    return true;
}
async function updateToken(messaging, tokenDetails) {
    try {
        const updatedToken = await requestUpdateToken(messaging.firebaseDependencies, tokenDetails);
        const updatedTokenDetails = {
            ...tokenDetails,
            token: updatedToken,
            createTime: Date.now()
        };
        await dbSet(messaging.firebaseDependencies, updatedTokenDetails);
        return updatedToken;
    }
    catch (e) {
        throw e;
    }
}
async function getNewToken(firebaseDependencies, subscriptionOptions) {
    const token = await requestGetToken(firebaseDependencies, subscriptionOptions);
    const tokenDetails = {
        token,
        createTime: Date.now(),
        subscriptionOptions
    };
    await dbSet(firebaseDependencies, tokenDetails);
    return tokenDetails.token;
}
/**
 * Gets a PushSubscription for the current user.
 */
async function getPushSubscription$1(swRegistration, vapidKey) {
    const subscription = await swRegistration.pushManager.getSubscription();
    if (subscription) {
        return subscription;
    }
    return swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        // Chrome <= 75 doesn't support base64-encoded VAPID key. For backward compatibility, VAPID key
        // submitted to pushManager#subscribe must be of type Uint8Array.
        applicationServerKey: base64ToArray(vapidKey)
    });
}
/**
 * Checks if the saved tokenDetails object matches the configuration provided.
 */
function isTokenValid(dbOptions, currentOptions) {
    const isVapidKeyEqual = currentOptions.vapidKey === dbOptions.vapidKey;
    const isEndpointEqual = currentOptions.endpoint === dbOptions.endpoint;
    const isAuthEqual = currentOptions.auth === dbOptions.auth;
    const isP256dhEqual = currentOptions.p256dh === dbOptions.p256dh;
    return isVapidKeyEqual && isEndpointEqual && isAuthEqual && isP256dhEqual;
}
/** Clears FID registration metadata; apps may mix legacy getToken() with FID register/unregister. */
async function removeFidRegistrationBestEffort(firebaseDependencies) {
    try {
        await dbRemoveFidRegistration(firebaseDependencies);
    }
    catch {
        // Ignore.
    }
}
function notifyOnRegistered(messaging, fid) {
    const handler = messaging.onRegisteredHandler;
    if (!handler) {
        return;
    }
    if (typeof handler === 'function') {
        handler(fid);
    }
    else {
        handler.next(fid);
    }
}
function notifyOnUnregistered(messaging, fid) {
    const handler = messaging.onUnregisteredHandler;
    if (!handler) {
        return;
    }
    if (typeof handler === 'function') {
        handler(fid);
    }
    else {
        handler.next(fid);
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
async function updateVapidKey(messaging, vapidKey) {
    if (!!vapidKey) {
        messaging.vapidKey = vapidKey;
    }
    else if (!messaging.vapidKey) {
        messaging.vapidKey = DEFAULT_VAPID_KEY;
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
/** Retries when CreateRegistration echoes an FID that does not match Installations.getId(). */
const FID_REGISTRATION_FID_MATCH_MAX_ATTEMPTS = 3;
/**
 * For the new FID-based register path:
 * - Create (or refresh) an FCM Web registration in the backend via CreateRegistration.
 * - Use the FIS auth token produced by the installations instance (implicitly associated with FID).
 * - CreateRegistration must echo the installation in `name` (e.g.
 *   `projects/{projectId}/registrations/{fid}`); it must match `expectedFid` from
 *   Installations.getId(). On mismatch we refresh the auth token and retry, then fail with
 *   `fid-registration-failed`.
 */
async function registerFcmRegistrationWithFid(messaging, expectedFid) {
    const pushSubscription = await getPushSubscription(messaging.swRegistration, messaging.vapidKey);
    const subscriptionOptions = {
        vapidKey: messaging.vapidKey,
        swScope: messaging.swRegistration.scope,
        endpoint: pushSubscription.endpoint,
        auth: arrayToBase64(pushSubscription.getKey('auth')),
        p256dh: arrayToBase64(pushSubscription.getKey('p256dh'))
    };
    const installations = messaging.firebaseDependencies.installations;
    for (let attempt = 0; attempt < FID_REGISTRATION_FID_MATCH_MAX_ATTEMPTS; attempt++) {
        const { responseFid } = await requestCreateRegistration(messaging.firebaseDependencies, subscriptionOptions);
        if (responseFid === expectedFid) {
            return;
        }
        // If CreateRegistration echoes an unexpected FID, the FIS auth token used for the request may
        // be stale relative to the installation the backend associates with the call. Force-refresh
        // the token before retrying so the next attempt uses credentials aligned with Installations.
        if (attempt < FID_REGISTRATION_FID_MATCH_MAX_ATTEMPTS - 1) {
            await installations.getToken(true);
        }
    }
    throw ERROR_FACTORY.create("fid-registration-failed" /* ErrorCode.FID_REGISTRATION_FAILED */, {
        errorInfo: 'CreateRegistration response FID does not match Firebase Installation ID'
    });
}
async function getPushSubscription(swRegistration, vapidKey) {
    const subscription = await swRegistration.pushManager.getSubscription();
    if (subscription) {
        return subscription;
    }
    // Chrome/Firefox require applicationServerKey to be of type Uint8Array.
    return swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        // `PushManager.subscribe` expects a `BufferSource`; `base64ToArray` produces a typed array.
        // Cast to satisfy the lib typing differences across TS DOM versions.
        applicationServerKey: base64ToArray(vapidKey)
    });
}

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
/**
 * Re-runs FCM FID registration when push subscription keys change (e.g. `pushsubscriptionchange`
 * in the service worker). No-op if the app instance was never registered via `register()`.
 * Best-effort: callers should catch failures when permission or push may be unavailable.
 */
async function refreshFidRegistrationIfStored(messaging) {
    const stored = await dbGetFidRegistration(messaging.firebaseDependencies).catch(() => undefined);
    if (!stored) {
        return undefined;
    }
    await updateVapidKey(messaging, stored.vapidKey);
    const fid = await messaging.firebaseDependencies.installations.getId();
    await registerFcmRegistrationWithFid(messaging, fid);
    await dbSetFidRegistration(messaging.firebaseDependencies, {
        fid,
        lastRegisterTime: Date.now(),
        vapidKey: messaging.vapidKey
    });
    notifyOnRegistered(messaging, fid);
    return fid;
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
function externalizePayload(internalPayload) {
    const payload = {
        from: internalPayload.from,
        // eslint-disable-next-line camelcase
        collapseKey: internalPayload.collapse_key,
        // eslint-disable-next-line camelcase
        messageId: internalPayload.fcmMessageId
    };
    propagateNotificationPayload(payload, internalPayload);
    propagateDataPayload(payload, internalPayload);
    propagateFcmOptions(payload, internalPayload);
    return payload;
}
function propagateNotificationPayload(payload, messagePayloadInternal) {
    if (!messagePayloadInternal.notification) {
        return;
    }
    payload.notification = {};
    const title = messagePayloadInternal.notification.title;
    if (!!title) {
        payload.notification.title = title;
    }
    const body = messagePayloadInternal.notification.body;
    if (!!body) {
        payload.notification.body = body;
    }
    const image = messagePayloadInternal.notification.image;
    if (!!image) {
        payload.notification.image = image;
    }
    const icon = messagePayloadInternal.notification.icon;
    if (!!icon) {
        payload.notification.icon = icon;
    }
}
function propagateDataPayload(payload, messagePayloadInternal) {
    if (!messagePayloadInternal.data) {
        return;
    }
    payload.data = messagePayloadInternal.data;
}
function propagateFcmOptions(payload, messagePayloadInternal) {
    // fcmOptions.link value is written into notification.click_action. see more in b/232072111
    if (!messagePayloadInternal.fcmOptions &&
        !messagePayloadInternal.notification?.click_action) {
        return;
    }
    payload.fcmOptions = {};
    const link = messagePayloadInternal.fcmOptions?.link ??
        messagePayloadInternal.notification?.click_action;
    if (!!link) {
        payload.fcmOptions.link = link;
    }
    // eslint-disable-next-line camelcase
    const analyticsLabel = messagePayloadInternal.fcmOptions?.analytics_label;
    if (!!analyticsLabel) {
        payload.fcmOptions.analyticsLabel = analyticsLabel;
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
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
function isConsoleMessage(data) {
    // This message has a campaign ID, meaning it was sent using the Firebase Console.
    return typeof data === 'object' && !!data && CONSOLE_CAMPAIGN_ID in data;
}

/**
 * @license
 * Copyright 2019 Google LLC
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
/** Returns a promise that resolves after given time passes. */
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/**
 * @license
 * Copyright 2019 Google LLC
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
const LOG_ENDPOINT = 'https://play.google.com/log?format=json_proto3';
/** First flush ASAP (next timer turn); `_dispatchLogEvents` reschedules with `LOG_INTERVAL_IN_MS`. */
const INITIAL_LOG_FLUSH_DELAY_MS = 0;
const FCM_TRANSPORT_KEY = _mergeStrings('AzSCbw63g1R0nCw85jG8', 'Iaya3yLKwmgvh7cF0q4');
function startLoggingService(messaging) {
    // Start only if not already scheduled/in-flight and there is work to do.
    if (messaging.logQueue.state === 'stopped' &&
        messaging.logEvents.length > 0) {
        _processQueue(messaging, INITIAL_LOG_FLUSH_DELAY_MS);
    }
}
/** Clears queued Firelog events, cancels any pending flush timer, and stops the logging loop. */
function stopLoggingServiceAndClearQueue(messaging) {
    if (messaging.logQueue.state === 'scheduled') {
        clearTimeout(messaging.logQueue.timerId);
    }
    messaging.logQueue = { state: 'stopped' };
    messaging.logEvents = [];
}
/**
 *
 * @param messaging the messaging instance.
 * @param offsetInMs this method execute after `offsetInMs` elapsed .
 */
function _processQueue(messaging, offsetInMs) {
    if (messaging.logQueue.state === 'scheduled') {
        clearTimeout(messaging.logQueue.timerId);
    }
    messaging.logQueue = { state: 'stopped' };
    if (!messaging.deliveryMetricsExportedToBigQueryEnabled) {
        messaging.logEvents = [];
        return;
    }
    messaging.logQueue = {
        state: 'scheduled',
        timerId: setTimeout(async () => {
            // Mark in-flight so stageLog/startLoggingService won't schedule duplicates mid-dispatch.
            messaging.logQueue = { state: 'flushing' };
            if (!messaging.logEvents.length) {
                return _processQueue(messaging, LOG_INTERVAL_IN_MS);
            }
            await _dispatchLogEvents(messaging);
        }, offsetInMs)
    };
}
async function _dispatchLogEvents(messaging) {
    // Swap the queue to avoid losing events added during an in-flight dispatch.
    const eventsToSend = messaging.logEvents;
    messaging.logEvents = [];
    for (let i = 0, n = eventsToSend.length; i < n; i += MAX_NUMBER_OF_EVENTS_PER_LOG_REQUEST) {
        const batch = eventsToSend.slice(i, i + MAX_NUMBER_OF_EVENTS_PER_LOG_REQUEST);
        if (!batch.length) {
            break;
        }
        const logRequest = _createLogRequest(batch);
        let retryCount = 0, response = {};
        do {
            try {
                response = await fetch(LOG_ENDPOINT.concat('&key=', FCM_TRANSPORT_KEY), {
                    method: 'POST',
                    body: JSON.stringify(logRequest)
                });
                // don't retry on 200s or non retriable errors
                if (response.ok || (!response.ok && !isRetriableError(response))) {
                    break;
                }
                if (!response.ok && isRetriableError(response)) {
                    // rethrow to retry with quota
                    throw new Error('a retriable Non-200 code is returned in fetch to Firelog endpoint. Retry');
                }
            }
            catch (error) {
                const isLastAttempt = retryCount === MAX_RETRIES;
                if (isLastAttempt) {
                    // existing the do-while interactive retry logic because retry quota has reached.
                    break;
                }
            }
            let delayInMs;
            try {
                delayInMs = Number((await response.json()).nextRequestWaitMillis);
            }
            catch (e) {
                delayInMs = DEFAULT_BACKOFF_TIME_MS;
            }
            await new Promise(resolve => setTimeout(resolve, delayInMs));
            retryCount++;
        } while (retryCount < MAX_RETRIES);
    }
    // Schedule next flush. If new events arrived during this dispatch, flush ASAP.
    _processQueue(messaging, messaging.logEvents.length ? INITIAL_LOG_FLUSH_DELAY_MS : LOG_INTERVAL_IN_MS);
}
function isRetriableError(response) {
    const httpStatus = response.status;
    return (httpStatus === 429 ||
        httpStatus === 500 ||
        httpStatus === 503 ||
        httpStatus === 504);
}
async function stageLog(messaging, internalPayload) {
    const fcmEvent = createFcmEvent(internalPayload, await messaging.firebaseDependencies.installations.getId());
    createAndEnqueueLogEvent(messaging, fcmEvent, internalPayload.productId);
    startLoggingService(messaging);
}
function createFcmEvent(internalPayload, fid) {
    const fcmEvent = {};
    /* eslint-disable camelcase */
    // some fields should always be non-null. Still check to ensure.
    if (!!internalPayload.from) {
        fcmEvent.project_number = internalPayload.from;
    }
    if (!!internalPayload.fcmMessageId) {
        fcmEvent.message_id = internalPayload.fcmMessageId;
    }
    fcmEvent.instance_id = fid;
    if (!!internalPayload.notification) {
        fcmEvent.message_type = MessageType$1.DISPLAY_NOTIFICATION.toString();
    }
    else {
        fcmEvent.message_type = MessageType$1.DATA_MESSAGE.toString();
    }
    fcmEvent.sdk_platform = SDK_PLATFORM_WEB.toString();
    fcmEvent.package_name = self.origin.replace(/(^\w+:|^)\/\//, '');
    if (!!internalPayload.collapse_key) {
        fcmEvent.collapse_key = internalPayload.collapse_key;
    }
    fcmEvent.event = EVENT_MESSAGE_DELIVERED.toString();
    if (!!internalPayload.fcmOptions?.analytics_label) {
        fcmEvent.analytics_label = internalPayload.fcmOptions?.analytics_label;
    }
    /* eslint-enable camelcase */
    return fcmEvent;
}
function createAndEnqueueLogEvent(messaging, fcmEvent, productId) {
    const logEvent = {};
    /* eslint-disable camelcase */
    logEvent.event_time_ms = Math.floor(Date.now()).toString();
    logEvent.source_extension_json_proto3 = JSON.stringify({
        messaging_client_event: fcmEvent
    });
    if (!!productId) {
        logEvent.compliance_data = buildComplianceData(productId);
    }
    // eslint-disable-next-line camelcase
    messaging.logEvents.push(logEvent);
}
function buildComplianceData(productId) {
    const complianceData = {
        privacy_context: {
            prequest: {
                origin_associated_product_id: productId
            }
        }
    };
    return complianceData;
}
function _createLogRequest(logEventQueue) {
    const logRequest = {};
    /* eslint-disable camelcase */
    logRequest.log_source = FCM_LOG_SOURCE.toString();
    logRequest.log_event = logEventQueue;
    /* eslint-enable camelcase */
    return logRequest;
}
function _mergeStrings(s1, s2) {
    const resultArray = [];
    for (let i = 0; i < s1.length; i++) {
        resultArray.push(s1.charAt(i));
        if (i < s2.length) {
            resultArray.push(s2.charAt(i));
        }
    }
    return resultArray.join('');
}

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
 */
async function onSubChange(event, messaging) {
    if (!messaging.swRegistration) {
        messaging.swRegistration = self.registration;
    }
    const { newSubscription } = event;
    if (!newSubscription) {
        // Subscription revoked: legacy token and FID register/unregister paths both flow through
        // revokeRegistrationInternal (server revoke + onUnregistered when applicable).
        await revokeRegistrationInternal(messaging);
        return;
    }
    const storedFid = await dbGetFidRegistration(messaging.firebaseDependencies).catch(() => undefined);
    if (storedFid) {
        const fid = await refreshFidRegistrationIfStored(messaging).catch(() => {
            // Best-effort: push subscription may be unavailable after rotation.
            return undefined;
        });
        if (fid) {
            const clientList = await getClientList();
            if (hasVisibleClients(clientList)) {
                sendFidRegisteredToWindows(clientList, fid);
            }
        }
        return;
    }
    const tokenDetails = await dbGet(messaging.firebaseDependencies);
    await revokeRegistrationInternal(messaging);
    messaging.vapidKey =
        tokenDetails?.subscriptionOptions?.vapidKey ?? DEFAULT_VAPID_KEY;
    await getTokenInternal(messaging);
}
async function onPush(event, messaging) {
    const internalPayload = getMessagePayloadInternal(event);
    if (!internalPayload) {
        // Failed to get parsed MessagePayload from the PushEvent. Skip handling the push.
        return;
    }
    /*
     * Log to Firelog based on user consent. Rather than calling startLoggingService once when
     * deliveryMetricsExportedToBigQueryEnabled is toggled, we now call stageLog for every received push.
     * This ensures the first telemetry event is uploaded immediately upon enabling the flag, simplifying debugging.
     */
    if (messaging.deliveryMetricsExportedToBigQueryEnabled) {
        await stageLog(messaging, internalPayload);
    }
    // foreground handling: eventually passed to onMessage hook
    const clientList = await getClientList();
    if (hasVisibleClients(clientList)) {
        return sendMessagePayloadInternalToWindows(clientList, internalPayload);
    }
    // background handling: display if possible and pass to onBackgroundMessage hook
    if (!!internalPayload.notification) {
        await showNotification(wrapInternalPayload(internalPayload));
    }
    if (!messaging) {
        return;
    }
    if (!!messaging.onBackgroundMessageHandler) {
        const payload = externalizePayload(internalPayload);
        if (typeof messaging.onBackgroundMessageHandler === 'function') {
            await messaging.onBackgroundMessageHandler(payload);
        }
        else {
            messaging.onBackgroundMessageHandler.next(payload);
        }
    }
}
async function onNotificationClick(event) {
    const internalPayload = event.notification?.data?.[FCM_MSG];
    if (!internalPayload) {
        return;
    }
    else if (event.action) {
        // User clicked on an action button. This will allow developers to act on action button clicks
        // by using a custom onNotificationClick listener that they define.
        return;
    }
    // Prevent other listeners from receiving the event
    event.stopImmediatePropagation();
    event.notification.close();
    // Note clicking on a notification with no link set will focus the Chrome's current tab.
    const link = getLink(internalPayload);
    if (!link) {
        return;
    }
    // FM should only open/focus links from app's origin.
    const url = new URL(link, self.location.href);
    const originUrl = new URL(self.location.origin);
    if (url.host !== originUrl.host) {
        return;
    }
    let client = await getWindowClient(url);
    if (!client) {
        client = await self.clients.openWindow(link);
        // Wait three seconds for the client to initialize and set up the message handler so that it
        // can receive the message.
        await sleep(3000);
    }
    else {
        client = await client.focus();
    }
    if (!client) {
        // Window Client will not be returned if it's for a third party origin.
        return;
    }
    internalPayload.messageType = MessageType.NOTIFICATION_CLICKED;
    internalPayload.isFirebaseMessaging = true;
    return client.postMessage(internalPayload);
}
function wrapInternalPayload(internalPayload) {
    const wrappedInternalPayload = {
        ...internalPayload.notification
    };
    // Put the message payload under FCM_MSG name so we can identify the notification as being an FCM
    // notification vs a notification from somewhere else (i.e. normal web push or developer generated
    // notification).
    wrappedInternalPayload.data = {
        [FCM_MSG]: internalPayload
    };
    return wrappedInternalPayload;
}
function getMessagePayloadInternal({ data }) {
    if (!data) {
        return null;
    }
    try {
        return data.json();
    }
    catch (err) {
        // Not JSON so not an FCM message.
        return null;
    }
}
/**
 * @param url The URL to look for when focusing a client.
 * @return Returns an existing window client or a newly opened WindowClient.
 */
async function getWindowClient(url) {
    const clientList = await getClientList();
    for (const client of clientList) {
        const clientUrl = new URL(client.url, self.location.href);
        if (url.host === clientUrl.host) {
            return client;
        }
    }
    return null;
}
/**
 * @returns If there is currently a visible WindowClient, this method will resolve to true,
 * otherwise false.
 */
function hasVisibleClients(clientList) {
    return clientList.some(client => client.visibilityState === 'visible' &&
        // Ignore chrome-extension clients as that matches the background pages of extensions, which
        // are always considered visible for some reason.
        !client.url.startsWith('chrome-extension://'));
}
function sendMessagePayloadInternalToWindows(clientList, internalPayload) {
    internalPayload.isFirebaseMessaging = true;
    internalPayload.messageType = MessageType.PUSH_RECEIVED;
    for (const client of clientList) {
        client.postMessage(internalPayload);
    }
}
function sendFidRegisteredToWindows(clientList, fid) {
    const payload = {
        isFirebaseMessaging: true,
        messageType: MessageType.FID_REGISTERED,
        fid
    };
    for (const client of clientList) {
        client.postMessage(payload);
    }
}
function getClientList() {
    return self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
        // TS doesn't know that "type: 'window'" means it'll return WindowClient[]
    });
}
function showNotification(notificationPayloadInternal) {
    // Note: Firefox does not support the maxActions property.
    // https://developer.mozilla.org/en-US/docs/Web/API/notification/maxActions
    const { actions } = notificationPayloadInternal;
    const { maxActions } = Notification;
    if (actions && maxActions && actions.length > maxActions) {
        console.warn(`This browser only supports ${maxActions} actions. The remaining actions will not be displayed.`);
    }
    return self.registration.showNotification(
    /* title= */ notificationPayloadInternal.title ?? '', notificationPayloadInternal);
}
function getLink(payload) {
    // eslint-disable-next-line camelcase
    const link = payload.fcmOptions?.link ?? payload.notification?.click_action;
    if (link) {
        return link;
    }
    if (isConsoleMessage(payload.data)) {
        // Notification created in the Firebase Console. Redirect to origin.
        return self.location.origin;
    }
    else {
        return null;
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
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
function extractAppConfig(app) {
    if (!app || !app.options) {
        throw getMissingValueError('App Configuration Object');
    }
    if (!app.name) {
        throw getMissingValueError('App Name');
    }
    // Required app config keys
    const configKeys = [
        'projectId',
        'apiKey',
        'appId',
        'messagingSenderId'
    ];
    const { options } = app;
    for (const keyName of configKeys) {
        if (!options[keyName]) {
            throw getMissingValueError(keyName);
        }
    }
    return {
        appName: app.name,
        projectId: options.projectId,
        apiKey: options.apiKey,
        appId: options.appId,
        senderId: options.messagingSenderId
    };
}
function getMissingValueError(valueName) {
    return ERROR_FACTORY.create("missing-app-config-values" /* ErrorCode.MISSING_APP_CONFIG_VALUES */, {
        valueName
    });
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
class MessagingService {
    constructor(app, installations, analyticsProvider) {
        // logging is only done with end user consent. Default to false.
        this.deliveryMetricsExportedToBigQueryEnabled = false;
        this.onBackgroundMessageHandler = null;
        this.onMessageHandler = null;
        /** Observer for the event that the app instance is registered with FCM via Firebase Installation ID (FID). */
        this.onRegisteredHandler = null;
        /** Observer for the event that the app instance is unregistered from FCM (FID no longer active). */
        this.onUnregisteredHandler = null;
        /**
         * Serializes the FID get + compare + notify step so concurrent register() calls
         * do not race each other.
         */
        this._registerNotifyChain = Promise.resolve();
        /** Unsubscribe from Installations `onIdChange` when messaging is deleted. */
        this._fidChangeUnsubscribe = null;
        this.logEvents = [];
        /**
         * Single source of truth for the logging loop lifecycle.
         *
         * `scheduled` holds the active timer id; `flushing` indicates an async dispatch
         * is in progress (prevents duplicate starts); `stopped` means idle.
         */
        this.logQueue = { state: 'stopped' };
        const appConfig = extractAppConfig(app);
        this.firebaseDependencies = {
            app,
            appConfig,
            installations,
            analyticsProvider
        };
    }
    _delete() {
        if (this._fidChangeUnsubscribe) {
            this._fidChangeUnsubscribe();
            this._fidChangeUnsubscribe = null;
        }
        if (this.logQueue.state === 'scheduled') {
            clearTimeout(this.logQueue.timerId);
        }
        this.logQueue = { state: 'stopped' };
        return Promise.resolve();
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
const SwMessagingFactory = (container) => {
    const messaging = new MessagingService(container.getProvider('app').getImmediate(), container.getProvider('installations-internal').getImmediate(), container.getProvider('analytics-internal'));
    self.addEventListener('push', e => {
        e.waitUntil(onPush(e, messaging));
    });
    self.addEventListener('pushsubscriptionchange', e => {
        e.waitUntil(onSubChange(e, messaging));
    });
    self.addEventListener('notificationclick', e => {
        e.waitUntil(onNotificationClick(e));
    });
    return messaging;
};
/**
 * The messaging instance registered in sw is named differently than that of in client. This is
 * because both `registerMessagingInWindow` and `registerMessagingInSw` would be called in
 * `messaging-compat` and component with the same name can only be registered once.
 */
function registerMessagingInSw() {
    app._registerComponent(new component.Component('messaging-sw', SwMessagingFactory, "PUBLIC" /* ComponentType.PUBLIC */));
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
 * Checks whether all required APIs exist within SW Context
 * @returns a Promise that resolves to a boolean.
 *
 * @public
 */
async function isSwSupported() {
    // firebase-js-sdk/issues/2393 reveals that idb#open in Safari iframe and Firefox private browsing
    // might be prohibited to run. In these contexts, an error would be thrown during the messaging
    // instantiating phase, informing the developers to import/call isSupported for special handling.
    return (util.isIndexedDBAvailable() &&
        (await util.validateIndexedDBOpenable()) &&
        'PushManager' in self &&
        'Notification' in self &&
        ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification') &&
        PushSubscription.prototype.hasOwnProperty('getKey'));
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
function onBackgroundMessage$1(messaging, nextOrObserver) {
    if (self.document !== undefined) {
        throw ERROR_FACTORY.create("only-available-in-sw" /* ErrorCode.AVAILABLE_IN_SW */);
    }
    messaging.onBackgroundMessageHandler = nextOrObserver;
    return () => {
        messaging.onBackgroundMessageHandler = null;
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
 * Subscribes to an event that the app instance is registered with FCM via Firebase Installation ID (FID).
 * Use the FID passed to the callback to upload it to your application server.
 *
 * @param messaging - The {@link MessagingService} instance.
 * @param nextOrObserver - A function or observer object called when an FID is registered.
 * @returns Unsubscribe function to stop listening.
 */
function onRegistered$1(messaging, nextOrObserver) {
    messaging.onRegisteredHandler = nextOrObserver;
    return () => {
        if (messaging.onRegisteredHandler === nextOrObserver) {
            messaging.onRegisteredHandler = null;
        }
    };
}

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
/**
 * Subscribes to an event that the app instance is unregistered from FCM so the FID is no longer active.
 * Use this to notify your backend to remove this FID to prevent 404 errors on send.
 *
 * @param messaging - The {@link MessagingService} instance.
 * @param nextOrObserver - A function or observer object called with the unregistered FID.
 * @returns Unsubscribe function to stop listening.
 */
function onUnregistered$1(messaging, nextOrObserver) {
    messaging.onUnregisteredHandler = nextOrObserver;
    return () => {
        if (messaging.onUnregisteredHandler === nextOrObserver) {
            messaging.onUnregisteredHandler = null;
        }
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
function _setDeliveryMetricsExportedToBigQueryEnabled(messaging, enable) {
    const messagingService = messaging;
    messagingService.deliveryMetricsExportedToBigQueryEnabled = enable;
    if (enable) {
        startLoggingService(messagingService);
    }
    else {
        stopLoggingServiceAndClearQueue(messagingService);
    }
}

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
 */
/**
 * Retrieves a Firebase Cloud Messaging instance.
 *
 * @returns The Firebase Cloud Messaging instance associated with the provided firebase app.
 *
 * @public
 */
function getMessagingInSw(app$1 = app.getApp()) {
    // Conscious decision to make this async check non-blocking during the messaging instance
    // initialization phase for performance consideration. An error would be thrown latter for
    // developer's information. Developers can then choose to import and call `isSupported` for
    // special handling.
    isSwSupported().then(isSupported => {
        // If `isSwSupported()` resolved, but returned false.
        if (!isSupported) {
            throw ERROR_FACTORY.create("unsupported-browser" /* ErrorCode.UNSUPPORTED_BROWSER */);
        }
    }, _ => {
        // If `isSwSupported()` rejected.
        throw ERROR_FACTORY.create("indexed-db-unsupported" /* ErrorCode.INDEXED_DB_UNSUPPORTED */);
    });
    return app._getProvider(util.getModularInstance(app$1), 'messaging-sw').getImmediate();
}
/**
 * Called when a message is received while the app is in the background. An app is considered to be
 * in the background if no active window is displayed.
 *
 * @param messaging - The {@link Messaging} instance.
 * @param nextOrObserver - This function, or observer object with `next` defined, is called when a
 * message is received and the app is currently in the background.
 *
 * @returns To stop listening for messages execute this returned function.
 *
 * @public
 */
function onBackgroundMessage(messaging, nextOrObserver) {
    messaging = util.getModularInstance(messaging);
    return onBackgroundMessage$1(messaging, nextOrObserver);
}
/**
 * Subscribes to an event that the app instance is registered with FCM via Firebase Installation ID (FID).
 * Use the FID passed to the callback to upload it to your application server. When you receive an FID
 * after calling {@link register}, instruct your backend to remove any legacy token for this instance.
 *
 * @param messaging - The {@link Messaging} instance.
 * @param nextOrObserver - A function or observer object called when an FID is registered.
 * @returns Unsubscribe function to stop listening.
 *
 * @public
 */
function onRegistered(messaging, nextOrObserver) {
    messaging = util.getModularInstance(messaging);
    return onRegistered$1(messaging, nextOrObserver);
}
/**
 * Subscribes to an event that the app instance is unregistered from FCM (FID no longer active).
 * Use this to notify your backend to remove this FID to prevent 404 errors on send.
 *
 * @param messaging - The {@link Messaging} instance.
 * @param nextOrObserver - A function or observer object called with the unregistered FID.
 * @returns Unsubscribe function to stop listening.
 *
 * @public
 */
function onUnregistered(messaging, nextOrObserver) {
    messaging = util.getModularInstance(messaging);
    return onUnregistered$1(messaging, nextOrObserver);
}
/**
 * Enables or disables Firebase Cloud Messaging message delivery metrics export to BigQuery. By
 * default, message delivery metrics are not exported to BigQuery. Use this method to enable or
 * disable the export at runtime.
 *
 * @param messaging - The `FirebaseMessaging` instance.
 * @param enable - Whether Firebase Cloud Messaging should export message delivery metrics to
 * BigQuery.
 *
 * @public
 */
function experimentalSetDeliveryMetricsExportedToBigQueryEnabled(messaging, enable) {
    messaging = util.getModularInstance(messaging);
    return _setDeliveryMetricsExportedToBigQueryEnabled(messaging, enable);
}

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
 */
registerMessagingInSw();

exports.experimentalSetDeliveryMetricsExportedToBigQueryEnabled = experimentalSetDeliveryMetricsExportedToBigQueryEnabled;
exports.getMessaging = getMessagingInSw;
exports.isSupported = isSwSupported;
exports.onBackgroundMessage = onBackgroundMessage;
exports.onRegistered = onRegistered;
exports.onUnregistered = onUnregistered;
//# sourceMappingURL=index.sw.cjs.map
