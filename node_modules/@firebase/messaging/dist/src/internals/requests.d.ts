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
import { SubscriptionOptions, TokenDetails } from '../interfaces/registration-details';
import { FirebaseInternalDependencies } from '../interfaces/internal-dependencies';
/** Max attempts (initial fetch + retries) when CreateRegistration `fetch()` throws. */
export declare const FID_REGISTRATION_FETCH_MAX_ATTEMPTS = 3;
/** Base delay in ms; backoff is `BASE * 2^attempt` after each failed attempt. */
export declare const FID_REGISTRATION_FETCH_BASE_BACKOFF_MS = 1000;
export interface ApiResponse {
    token?: string;
    /**
     * CreateRegistration resource name, e.g. `projects/{projectId}/registrations/{fid}`.
     */
    name?: string;
    error?: {
        message: string;
    };
}
export interface ApiRequestBody {
    fcm_sdk_version?: string;
    web: {
        /**
         * Client identifier for the registration: the site host (e.g. `www.example.com`) when the
         * service worker scope is a URL, otherwise the app name.
         */
        origin: string;
        endpoint: string;
        p256dh: string;
        auth: string;
        applicationPubKey?: string;
    };
}
export declare function requestGetToken(firebaseDependencies: FirebaseInternalDependencies, subscriptionOptions: SubscriptionOptions): Promise<string>;
/**
 * Creates (or refreshes) an FCM Web registration via CreateRegistration.
 *
 * This is used by the FID-based register path, where we don't require the returned FCM token, but
 * we do require a non-empty `name` (echoing the Firebase Installation ID) in the success response body.
 */
export interface CreateRegistrationResult {
    /** Firebase Installation ID parsed from the CreateRegistration response `name` field. */
    responseFid: string;
}
export declare function requestCreateRegistration(firebaseDependencies: FirebaseInternalDependencies, subscriptionOptions: SubscriptionOptions): Promise<CreateRegistrationResult>;
/**
 * Deletes an FCM Web registration via DeleteRegistration using the Firebase Installation ID (FID).
 */
export declare function requestDeleteRegistration(firebaseDependencies: FirebaseInternalDependencies, fid: string): Promise<void>;
export declare function requestUpdateToken(firebaseDependencies: FirebaseInternalDependencies, tokenDetails: TokenDetails): Promise<string>;
export declare function requestDeleteToken(firebaseDependencies: FirebaseInternalDependencies, token: string): Promise<void>;
/**
 * Hostname for the registering web client (e.g. `www.example.com`), or the app name
 * (`appNameFallback`) when the scope cannot be resolved (e.g. some test environments).
 */
export declare function getRegistrationOrigin(swScope: string, appNameFallback: string): string;
