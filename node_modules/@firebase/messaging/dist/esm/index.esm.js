import { onIdChange } from '@firebase/installations';
import { Component } from '@firebase/component';
import { openDB, deleteDB } from 'idb';
import { ErrorFactory, validateIndexedDBOpenable, isIndexedDBAvailable, areCookiesEnabled, getModularInstance } from '@firebase/util';
import { _registerComponent, registerVersion, _getProvider, getApp } from '@firebase/app';

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
const DEFAULT_SW_PATH = '/firebase-messaging-sw.js';
const DEFAULT_SW_SCOPE = '/firebase-cloud-messaging-push-scope';
const DEFAULT_VAPID_KEY = 'BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4';
const ENDPOINT = 'https://fcmregistrations.googleapis.com/v1';
const CONSOLE_CAMPAIGN_ID = 'google.c.a.c_id';
const CONSOLE_CAMPAIGN_NAME = 'google.c.a.c_l';
const CONSOLE_CAMPAIGN_TIME = 'google.c.a.ts';
/** Set to '1' if Analytics is enabled for the campaign */
const CONSOLE_CAMPAIGN_ANALYTICS_ENABLED = 'google.c.a.e';
const DEFAULT_REGISTRATION_TIMEOUT = 10000;
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
    const db = await openDB(OLD_DB_NAME, OLD_DB_VERSION, {
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
    await deleteDB(OLD_DB_NAME);
    await deleteDB('fcm_vapid_details_db');
    await deleteDB('undefined');
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
const ERROR_FACTORY = new ErrorFactory('messaging', 'Messaging', ERROR_MAP);

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
const defaultIdb = { openDB, deleteDB };
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

const name = "@firebase/messaging";
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
async function registerDefaultSw(messaging) {
    try {
        messaging.swRegistration = await navigator.serviceWorker.register(DEFAULT_SW_PATH, {
            scope: DEFAULT_SW_SCOPE
        });
        // The timing when browser updates sw when sw has an update is unreliable from experiment. It
        // leads to version conflict when the SDK upgrades to a newer version in the main page, but sw
        // is stuck with the old version. For example,
        // https://github.com/firebase/firebase-js-sdk/issues/2590 The following line reliably updates
        // sw if there was an update.
        messaging.swRegistration.update().catch(() => {
            /* it is non blocking and we don't care if it failed */
        });
        await waitForRegistrationActive(messaging.swRegistration);
    }
    catch (e) {
        throw ERROR_FACTORY.create("failed-service-worker-registration" /* ErrorCode.FAILED_DEFAULT_REGISTRATION */, {
            browserErrorMessage: e?.message
        });
    }
}
/**
 * Waits for registration to become active. MDN documentation claims that
 * a service worker registration should be ready to use after awaiting
 * navigator.serviceWorker.register() but that doesn't seem to be the case in
 * practice, causing the SDK to throw errors when calling
 * swRegistration.pushManager.subscribe() too soon after register(). The only
 * solution seems to be waiting for the service worker registration `state`
 * to become "active".
 */
async function waitForRegistrationActive(registration) {
    return new Promise((resolve, reject) => {
        const rejectTimeout = setTimeout(() => reject(new Error(`Service worker not registered after ${DEFAULT_REGISTRATION_TIMEOUT} ms`)), DEFAULT_REGISTRATION_TIMEOUT);
        const incomingSw = registration.installing || registration.waiting;
        if (registration.active) {
            clearTimeout(rejectTimeout);
            resolve();
        }
        else if (incomingSw) {
            incomingSw.onstatechange = ev => {
                if (ev.target?.state === 'activated') {
                    incomingSw.onstatechange = null;
                    clearTimeout(rejectTimeout);
                    resolve();
                }
            };
        }
        else {
            clearTimeout(rejectTimeout);
            reject(new Error('No incoming service worker found.'));
        }
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
async function updateSwReg(messaging, swRegistration) {
    if (!swRegistration && !messaging.swRegistration) {
        await registerDefaultSw(messaging);
    }
    if (!swRegistration && !!messaging.swRegistration) {
        return;
    }
    if (!(swRegistration instanceof ServiceWorkerRegistration)) {
        throw ERROR_FACTORY.create("invalid-sw-registration" /* ErrorCode.INVALID_SW_REGISTRATION */);
    }
    messaging.swRegistration = swRegistration;
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
const FID_REGISTRATION_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/**
 * Registers the app instance with FCM using its Firebase Installation ID (FID). The FID is
 * delivered via the `onRegistered` callback. Call this to establish an FID-based identity.
 * Once `onRegistered` provides an FID, instruct your backend to remove any legacy token
 * previously associated with this instance. The backend send API supports FID as a target.
 *
 * When called multiple times, `onRegistered` is invoked on each call with the current FID.
 * Backend registration sync runs on first register, when the FID changes, or on weekly refresh.
 *
 * @param messaging - The MessagingService instance.
 * @param options - Optional. Same options as getToken (vapidKey, serviceWorkerRegistration).
 */
async function register$1(messaging, options) {
    if (!navigator) {
        throw ERROR_FACTORY.create("only-available-in-window" /* ErrorCode.AVAILABLE_IN_WINDOW */);
    }
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') {
        throw ERROR_FACTORY.create("permission-blocked" /* ErrorCode.PERMISSION_BLOCKED */);
    }
    if (!messaging.onRegisteredHandler) {
        throw ERROR_FACTORY.create("invalid-on-registered-handler" /* ErrorCode.INVALID_ON_REGISTERED_HANDLER */);
    }
    await updateVapidKey(messaging, options?.vapidKey);
    await updateSwReg(messaging, options?.serviceWorkerRegistration);
    // Keep the queue alive after a failed register() so future calls can retry.
    const prev = messaging._registerNotifyChain.catch(() => { });
    messaging._registerNotifyChain = prev.then(async () => {
        const fid = await messaging.firebaseDependencies.installations.getId();
        const stored = await dbGetFidRegistration(messaging.firebaseDependencies);
        const now = Date.now();
        const shouldRefresh = !stored ||
            stored.fid !== fid ||
            now >= stored.lastRegisterTime + FID_REGISTRATION_REFRESH_MS;
        if (shouldRefresh) {
            await registerFcmRegistrationWithFid(messaging, fid);
            await dbSetFidRegistration(messaging.firebaseDependencies, {
                fid,
                lastRegisterTime: now,
                vapidKey: messaging.vapidKey
            });
        }
        const handler = messaging.onRegisteredHandler;
        if (!handler) {
            throw ERROR_FACTORY.create("invalid-on-registered-handler" /* ErrorCode.INVALID_ON_REGISTERED_HANDLER */);
        }
        notifyOnRegistered(messaging, fid);
    });
    return messaging._registerNotifyChain;
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
 * When the Firebase Installation ID changes, re-run `register()` so FCM registration and
 * onRegistered run for the new FID. No-op if no onRegistered handler is set or the app
 * instance was never registered with FCM.
 */
function subscribeFidChangeRegistration(messaging, installations) {
    return onIdChange(installations, () => {
        void (async () => {
            if (!messaging.onRegisteredHandler) {
                return;
            }
            const stored = await dbGetFidRegistration(messaging.firebaseDependencies);
            if (!stored) {
                return;
            }
            await register$1(messaging).catch(() => {
                // Best-effort: permission may be revoked or SW unavailable after FID rotation.
            });
        })();
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
async function getToken$1(messaging, options) {
    if (!navigator) {
        throw ERROR_FACTORY.create("only-available-in-window" /* ErrorCode.AVAILABLE_IN_WINDOW */);
    }
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') {
        throw ERROR_FACTORY.create("permission-blocked" /* ErrorCode.PERMISSION_BLOCKED */);
    }
    await updateVapidKey(messaging, options?.vapidKey);
    await updateSwReg(messaging, options?.serviceWorkerRegistration);
    return getTokenInternal(messaging);
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
async function logToScion(messaging, messageType, data) {
    const eventType = getEventType(messageType);
    const analytics = await messaging.firebaseDependencies.analyticsProvider.get();
    analytics.logEvent(eventType, {
        /* eslint-disable camelcase */
        message_id: data[CONSOLE_CAMPAIGN_ID],
        message_name: data[CONSOLE_CAMPAIGN_NAME],
        message_time: data[CONSOLE_CAMPAIGN_TIME],
        message_device_time: Math.floor(Date.now() / 1000)
        /* eslint-enable camelcase */
    });
}
function getEventType(messageType) {
    switch (messageType) {
        case MessageType.NOTIFICATION_CLICKED:
            return 'notification_open';
        case MessageType.PUSH_RECEIVED:
            return 'notification_foreground';
        default:
            throw new Error();
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
async function messageEventListener(messaging, event) {
    const internalPayload = event.data;
    if (!internalPayload.isFirebaseMessaging) {
        return;
    }
    if (messaging.onMessageHandler &&
        internalPayload.messageType === MessageType.PUSH_RECEIVED) {
        if (typeof messaging.onMessageHandler === 'function') {
            messaging.onMessageHandler(externalizePayload(internalPayload));
        }
        else {
            messaging.onMessageHandler.next(externalizePayload(internalPayload));
        }
    }
    if (messaging.onRegisteredHandler &&
        internalPayload.messageType === MessageType.FID_REGISTERED) {
        const fid = internalPayload.fid;
        if (typeof messaging.onRegisteredHandler === 'function') {
            messaging.onRegisteredHandler(fid);
        }
        else {
            messaging.onRegisteredHandler.next(fid);
        }
    }
    // Log to Scion if applicable
    const dataPayload = internalPayload.data;
    if (isConsoleMessage(dataPayload) &&
        dataPayload[CONSOLE_CAMPAIGN_ANALYTICS_ENABLED] === '1') {
        await logToScion(messaging, internalPayload.messageType, dataPayload);
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
const WindowMessagingFactory = (container) => {
    const messaging = new MessagingService(container.getProvider('app').getImmediate(), container.getProvider('installations-internal').getImmediate(), container.getProvider('analytics-internal'));
    navigator.serviceWorker.addEventListener('message', e => messageEventListener(messaging, e));
    messaging._fidChangeUnsubscribe = subscribeFidChangeRegistration(messaging, container.getProvider('installations').getImmediate());
    return messaging;
};
const WindowMessagingInternalFactory = (container) => {
    const messaging = container
        .getProvider('messaging')
        .getImmediate();
    const messagingInternal = {
        getToken: (options) => getToken$1(messaging, options),
        register: (options) => register$1(messaging, options)
    };
    return messagingInternal;
};
function registerMessagingInWindow() {
    _registerComponent(new Component('messaging', WindowMessagingFactory, "PUBLIC" /* ComponentType.PUBLIC */));
    _registerComponent(new Component('messaging-internal', WindowMessagingInternalFactory, "PRIVATE" /* ComponentType.PRIVATE */));
    registerVersion(name, version);
    // BUILD_TARGET will be replaced by values like esm, cjs, etc during the compilation
    registerVersion(name, version, 'esm2020');
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
 * Checks if all required APIs exist in the browser.
 * @returns a Promise that resolves to a boolean.
 *
 * @public
 */
async function isWindowSupported() {
    try {
        // This throws if open() is unsupported, so adding it to the conditional
        // statement below can cause an uncaught error.
        await validateIndexedDBOpenable();
    }
    catch (e) {
        return false;
    }
    // firebase-js-sdk/issues/2393 reveals that idb#open in Safari iframe and Firefox private browsing
    // might be prohibited to run. In these contexts, an error would be thrown during the messaging
    // instantiating phase, informing the developers to import/call isSupported for special handling.
    return (typeof window !== 'undefined' &&
        isIndexedDBAvailable() &&
        areCookiesEnabled() &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        'fetch' in window &&
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
async function deleteToken$1(messaging) {
    if (!navigator) {
        throw ERROR_FACTORY.create("only-available-in-window" /* ErrorCode.AVAILABLE_IN_WINDOW */);
    }
    if (!messaging.swRegistration) {
        await registerDefaultSw(messaging);
    }
    return revokeRegistrationInternal(messaging);
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
function onMessage$1(messaging, nextOrObserver) {
    if (!navigator) {
        throw ERROR_FACTORY.create("only-available-in-window" /* ErrorCode.AVAILABLE_IN_WINDOW */);
    }
    messaging.onMessageHandler = nextOrObserver;
    return () => {
        messaging.onMessageHandler = null;
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
 * Unregisters the app instance from FCM by deleting its FID-based registration.
 *
 * On success, triggers the `onUnregistered` callback (if set) with the unregistered FID.
 *
 * @param messaging - The MessagingService instance.
 */
async function unregister$1(messaging) {
    if (!navigator) {
        throw ERROR_FACTORY.create("only-available-in-window" /* ErrorCode.AVAILABLE_IN_WINDOW */);
    }
    // Prefer the last successfully registered FID from local metadata when available.
    const stored = await dbGetFidRegistration(messaging.firebaseDependencies).catch(() => undefined);
    const fid = stored?.fid ?? (await messaging.firebaseDependencies.installations.getId());
    await requestDeleteRegistration(messaging.firebaseDependencies, fid);
    // Best-effort local cleanup; still resolve even if schema is unavailable.
    try {
        await dbRemoveFidRegistration(messaging.firebaseDependencies);
    }
    catch {
        // Ignore.
    }
    // Best-effort cleanup of legacy token details created via getToken().
    try {
        await dbRemove(messaging.firebaseDependencies);
    }
    catch {
        // Ignore.
    }
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
function getMessagingInWindow(app = getApp()) {
    // Conscious decision to make this async check non-blocking during the messaging instance
    // initialization phase for performance consideration. An error would be thrown latter for
    // developer's information. Developers can then choose to import and call `isSupported` for
    // special handling.
    isWindowSupported().then(isSupported => {
        // If `isWindowSupported()` resolved, but returned false.
        if (!isSupported) {
            throw ERROR_FACTORY.create("unsupported-browser" /* ErrorCode.UNSUPPORTED_BROWSER */);
        }
    }, _ => {
        // If `isWindowSupported()` rejected.
        throw ERROR_FACTORY.create("indexed-db-unsupported" /* ErrorCode.INDEXED_DB_UNSUPPORTED */);
    });
    return _getProvider(getModularInstance(app), 'messaging').getImmediate();
}
/**
 * Subscribes the {@link Messaging} instance to push notifications. Returns a Firebase Cloud
 * Messaging registration token that can be used to send push messages to that {@link Messaging}
 * instance.
 *
 * If notification permission isn't already granted, this method asks the user for permission. The
 * returned promise rejects if the user does not allow the app to show notifications.
 *
 * @param messaging - The {@link Messaging} instance.
 * @param options - Provides an optional vapid key and an optional service worker registration.
 *
 * @returns The promise resolves with an FCM registration token.
 *
 * @deprecated Use {@link register} together with {@link onRegistered} for Firebase
 * Installation ID-based messaging instead of retrieving an FCM registration token with this API.
 *
 * @public
 */
async function getToken(messaging, options) {
    messaging = getModularInstance(messaging);
    return getToken$1(messaging, options);
}
/**
 * Deletes the registration token associated with this {@link Messaging} instance and unsubscribes
 * the {@link Messaging} instance from the push subscription.
 *
 * If there is no legacy registration token but the client has FID-based registration metadata
 * (from {@link register}), this deletes that registration on the server, clears local metadata, and
 * invokes {@link onUnregistered} with the removed FID when successful.
 *
 * @param messaging - The {@link Messaging} instance.
 *
 * @returns The promise resolves when the token has been successfully deleted.
 *
 * @deprecated Use {@link onUnregistered} to observe when the client is no longer
 * registered and update your backend accordingly, instead of explicitly deleting the
 * registration token with this API.
 *
 * @public
 */
function deleteToken(messaging) {
    messaging = getModularInstance(messaging);
    return deleteToken$1(messaging);
}
/**
 * When a push message is received and the user is currently on a page for your origin, the
 * message is passed to the page and an `onMessage()` event is dispatched with the payload of
 * the push message.
 *
 *
 * @param messaging - The {@link Messaging} instance.
 * @param nextOrObserver - This function, or observer object with `next` defined,
 *     is called when a message is received and the user is currently viewing your page.
 * @returns To stop listening for messages execute this returned function.
 *
 * @public
 */
function onMessage(messaging, nextOrObserver) {
    messaging = getModularInstance(messaging);
    return onMessage$1(messaging, nextOrObserver);
}
/**
 * Registers the app instance with FCM using its Firebase Installation ID (FID). The FID is
 * delivered via the {@link onRegistered} callback, not as a return value. Call this to establish
 * an FID-based identity; once {@link onRegistered} provides an FID, instruct your backend to
 * remove any legacy token previously associated with this instance. The backend send API
 * supports FID as a target.
 *
 * @param messaging - The {@link Messaging} instance.
 * @param options - Optional. VAPID key and/or service worker registration (same as getToken).
 * @returns Promise that resolves when registration has been initiated; FID is delivered via onRegistered.
 *
 * @public
 */
async function register(messaging, options) {
    messaging = getModularInstance(messaging);
    return register$1(messaging, options);
}
/**
 * Unregisters the app instance from FCM by deleting its FID-based registration.
 * On success, triggers {@link onUnregistered} (if registered) with the unregistered FID.
 *
 * @param messaging - The {@link Messaging} instance.
 *
 * @public
 */
async function unregister(messaging) {
    messaging = getModularInstance(messaging);
    return unregister$1(messaging);
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
    messaging = getModularInstance(messaging);
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
    messaging = getModularInstance(messaging);
    return onUnregistered$1(messaging, nextOrObserver);
}

/**
 * The Firebase Cloud Messaging Web SDK.
 * This SDK does not work in a Node.js environment.
 *
 * @packageDocumentation
 */
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
registerMessagingInWindow();

export { deleteToken, getMessagingInWindow as getMessaging, getToken, isWindowSupported as isSupported, onMessage, onRegistered, onUnregistered, register, unregister };
//# sourceMappingURL=index.esm.js.map
