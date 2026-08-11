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
/**
 * For the new FID-based register path:
 * - Create (or refresh) an FCM Web registration in the backend via CreateRegistration.
 * - Use the FIS auth token produced by the installations instance (implicitly associated with FID).
 * - CreateRegistration must echo the installation in `name` (e.g.
 *   `projects/{projectId}/registrations/{fid}`); it must match `expectedFid` from
 *   Installations.getId(). On mismatch we refresh the auth token and retry, then fail with
 *   `fid-registration-failed`.
 */
export declare function registerFcmRegistrationWithFid(messaging: MessagingService, expectedFid: string): Promise<void>;
