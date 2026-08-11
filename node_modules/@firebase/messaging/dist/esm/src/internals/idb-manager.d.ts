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
import { deleteDB, openDB } from 'idb';
import { FirebaseInternalDependencies } from '../interfaces/internal-dependencies';
import { TokenDetails } from '../interfaces/registration-details';
export declare const DATABASE_NAME = "firebase-messaging-database";
export interface FidRegistrationDetails {
    fid: string;
    lastRegisterTime: number;
    vapidKey?: string;
}
interface IdbImpl {
    openDB: typeof openDB;
    deleteDB: typeof deleteDB;
}
export declare function _setIdbForTests(impl: IdbImpl): void;
export declare function _resetIdbForTests(): void;
export declare function dbGet(firebaseDependencies: FirebaseInternalDependencies): Promise<TokenDetails | undefined>;
export declare function dbSet(firebaseDependencies: FirebaseInternalDependencies, tokenDetails: TokenDetails): Promise<TokenDetails>;
export declare function dbRemove(firebaseDependencies: FirebaseInternalDependencies): Promise<void>;
export declare function dbGetFidRegistration(firebaseDependencies: FirebaseInternalDependencies): Promise<FidRegistrationDetails | undefined>;
export declare function dbSetFidRegistration(firebaseDependencies: FirebaseInternalDependencies, details: FidRegistrationDetails): Promise<FidRegistrationDetails>;
export declare function dbRemoveFidRegistration(firebaseDependencies: FirebaseInternalDependencies): Promise<void>;
/** Deletes the DB. Useful for tests. */
export declare function dbDelete(): Promise<void>;
export {};
