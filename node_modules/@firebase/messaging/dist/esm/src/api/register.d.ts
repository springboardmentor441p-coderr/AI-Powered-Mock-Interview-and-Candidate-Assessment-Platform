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
import { MessagingService } from '../messaging-service';
import { RegisterOptions } from '../interfaces/public-types';
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
export declare function register(messaging: MessagingService, options?: RegisterOptions): Promise<void>;
