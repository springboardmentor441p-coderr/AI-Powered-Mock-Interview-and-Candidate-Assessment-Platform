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
import { MessagingService } from '../messaging-service';
export declare function getTokenInternal(messaging: MessagingService): Promise<string>;
/**
 * Revokes the app's FCM registration: legacy token (getToken/deleteToken) and/or FID-based
 * registration (register/unregister), clears local caches, notifies onUnregistered when a stored
 * FID existed, then unsubscribes the push subscription when present.
 */
export declare function revokeRegistrationInternal(messaging: MessagingService): Promise<boolean>;
export declare function notifyOnRegistered(messaging: MessagingService, fid: string): void;
export declare function notifyOnUnregistered(messaging: MessagingService, fid: string): void;
