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
import { EmulatorMockTokenOptions } from '@firebase/util';
import { FirestoreLocalCache } from '../api/cache_config';
import { CredentialsSettings } from '../api/credentials';
import { ExperimentalLongPollingOptions } from '../api/long_polling_options';
export declare const DEFAULT_HOST = "firestore.googleapis.com";
export declare const DEFAULT_SSL = true;
/**
 * Specifies custom configurations for your Cloud Firestore instance.
 * You must set these before invoking any other methods.
 */
export interface FirestoreSettings {
    /** The hostname to connect to. */
    host?: string;
    /** Whether to use SSL when connecting. */
    ssl?: boolean;
    /**
     * Whether to skip nested properties that are set to `undefined` during
     * object serialization. If set to `true`, these properties are skipped
     * and not written to Firestore. If set to `false` or omitted, the SDK
     * throws an exception when it encounters properties of type `undefined`.
     */
    ignoreUndefinedProperties?: boolean;
    /**
     * Only applicable in Node environments.
     *
     * The gRPC flow control window size in bytes. Defaults to 256 KB.
     * This maps directly to grpc-node's {@link https://github.com/grpc/grpc-node/blob/651cbeec6b4d6d11cbee91c042946d2fe5968ef6/packages/grpc-js/README.md#supported-channel-options | grpc-node.flow_control_window } setting.
     *
     * **WARNING:** This is an advanced setting. The default of 256 KB is optimized
     * for most Node workloads. Only modify this if you are actively tuning gRPC
     * network behavior and understand the implications of HTTP/2 flow control.
     */
    grpcFlowControlWindow?: number;
    /**
     * @internal
     * Undocumented setting for internal Google consumers.
     * External callers needing this feature, please let us
     * know by opening a feature request in the repository.
     */
    _customHeaders?: Record<string, string>;
}
/**
 * @internal
 * Undocumented, private additional settings not exposed in our public API.
 */
export interface PrivateSettings extends FirestoreSettings {
    credentials?: CredentialsSettings;
    cacheSizeBytes?: number;
    experimentalForceLongPolling?: boolean;
    experimentalAutoDetectLongPolling?: boolean;
    experimentalLongPollingOptions?: ExperimentalLongPollingOptions;
    useFetchStreams?: boolean;
    emulatorOptions?: {
        mockUserToken?: EmulatorMockTokenOptions | string;
    };
    localCache?: FirestoreLocalCache;
}
/**
 * A concrete type describing all the values that can be applied via a
 * user-supplied `FirestoreSettings` object. This is a separate type so that
 * defaults can be supplied and the value can be checked for equality.
 */
export declare class FirestoreSettingsImpl {
    /** The hostname to connect to. */
    readonly host: string;
    /** Whether to use SSL when connecting. */
    readonly ssl: boolean;
    readonly cacheSizeBytes: number;
    readonly experimentalForceLongPolling: boolean;
    readonly experimentalAutoDetectLongPolling: boolean;
    readonly experimentalLongPollingOptions: ExperimentalLongPollingOptions;
    readonly ignoreUndefinedProperties: boolean;
    readonly useFetchStreams: boolean;
    readonly localCache?: FirestoreLocalCache;
    readonly _customHeaders?: Record<string, string>;
    readonly isUsingEmulator: boolean;
    readonly grpcFlowControlWindow?: number;
    credentials?: any;
    constructor(settings: PrivateSettings);
    isEqual(other: FirestoreSettingsImpl): boolean;
}
