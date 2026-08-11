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
import { FirebaseApp, _FirebaseService } from '@firebase/app';
import { MessagePayload, NextFn, Observer } from './interfaces/public-types';
import { FirebaseAnalyticsInternalName } from '@firebase/analytics-interop-types';
import { FirebaseInternalDependencies } from './interfaces/internal-dependencies';
import { LogEvent } from './interfaces/logging-types';
import { Provider } from '@firebase/component';
import { _FirebaseInstallationsInternal, IdChangeUnsubscribeFn } from '@firebase/installations';
export declare class MessagingService implements _FirebaseService {
    readonly app: FirebaseApp;
    readonly firebaseDependencies: FirebaseInternalDependencies;
    swRegistration?: ServiceWorkerRegistration;
    vapidKey?: string;
    deliveryMetricsExportedToBigQueryEnabled: boolean;
    onBackgroundMessageHandler: NextFn<MessagePayload> | Observer<MessagePayload> | null;
    onMessageHandler: NextFn<MessagePayload> | Observer<MessagePayload> | null;
    /** Observer for the event that the app instance is registered with FCM via Firebase Installation ID (FID). */
    onRegisteredHandler: NextFn<string> | Observer<string> | null;
    /** Observer for the event that the app instance is unregistered from FCM (FID no longer active). */
    onUnregisteredHandler: NextFn<string> | Observer<string> | null;
    /**
     * Serializes the FID get + compare + notify step so concurrent register() calls
     * do not race each other.
     */
    _registerNotifyChain: Promise<void>;
    /** Unsubscribe from Installations `onIdChange` when messaging is deleted. */
    _fidChangeUnsubscribe: IdChangeUnsubscribeFn | null;
    logEvents: LogEvent[];
    /**
     * Single source of truth for the logging loop lifecycle.
     *
     * `scheduled` holds the active timer id; `flushing` indicates an async dispatch
     * is in progress (prevents duplicate starts); `stopped` means idle.
     */
    logQueue: LogQueueState;
    constructor(app: FirebaseApp, installations: _FirebaseInstallationsInternal, analyticsProvider: Provider<FirebaseAnalyticsInternalName>);
    _delete(): Promise<void>;
}
export type LogQueueState = {
    state: 'stopped';
} | {
    state: 'scheduled';
    timerId: ReturnType<typeof setTimeout>;
} | {
    state: 'flushing';
};
