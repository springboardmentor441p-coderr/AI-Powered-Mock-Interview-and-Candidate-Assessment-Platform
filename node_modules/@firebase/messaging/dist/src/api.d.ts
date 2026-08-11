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
import { FirebaseApp } from '@firebase/app';
import { GetTokenOptions, MessagePayload, Messaging, RegisterOptions } from './interfaces/public-types';
import { NextFn, Observer, Unsubscribe } from '@firebase/util';
/**
 * Retrieves a Firebase Cloud Messaging instance.
 *
 * @returns The Firebase Cloud Messaging instance associated with the provided firebase app.
 *
 * @public
 */
export declare function getMessagingInWindow(app?: FirebaseApp): Messaging;
/**
 * Retrieves a Firebase Cloud Messaging instance.
 *
 * @returns The Firebase Cloud Messaging instance associated with the provided firebase app.
 *
 * @public
 */
export declare function getMessagingInSw(app?: FirebaseApp): Messaging;
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
export declare function getToken(messaging: Messaging, options?: GetTokenOptions): Promise<string>;
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
export declare function deleteToken(messaging: Messaging): Promise<boolean>;
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
export declare function onMessage(messaging: Messaging, nextOrObserver: NextFn<MessagePayload> | Observer<MessagePayload>): Unsubscribe;
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
export declare function onBackgroundMessage(messaging: Messaging, nextOrObserver: NextFn<MessagePayload> | Observer<MessagePayload>): Unsubscribe;
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
export declare function register(messaging: Messaging, options?: RegisterOptions): Promise<void>;
/**
 * Unregisters the app instance from FCM by deleting its FID-based registration.
 * On success, triggers {@link onUnregistered} (if registered) with the unregistered FID.
 *
 * @param messaging - The {@link Messaging} instance.
 *
 * @public
 */
export declare function unregister(messaging: Messaging): Promise<void>;
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
export declare function onRegistered(messaging: Messaging, nextOrObserver: NextFn<string> | Observer<string>): Unsubscribe;
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
export declare function onUnregistered(messaging: Messaging, nextOrObserver: NextFn<string> | Observer<string>): Unsubscribe;
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
export declare function experimentalSetDeliveryMetricsExportedToBigQueryEnabled(messaging: Messaging, enable: boolean): void;
