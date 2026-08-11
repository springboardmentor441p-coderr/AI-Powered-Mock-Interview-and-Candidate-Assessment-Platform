import { r as registerAuth, i as initializeAuth, c as connectAuthEmulator, a as indexedDBLocalPersistence } from './register-Ct10ccti.js';
export { A as ActionCodeURL, b as AuthCredential, d as AuthErrorCodes, E as EmailAuthCredential, e as EmailAuthProvider, F as FacebookAuthProvider, G as GithubAuthProvider, f as GoogleAuthProvider, O as OAuthCredential, g as OAuthProvider, P as PhoneAuthCredential, S as SAMLAuthProvider, T as TotpMultiFactorGenerator, h as TotpSecret, j as TwitterAuthProvider, k as applyActionCode, l as beforeAuthStateChanged, m as checkActionCode, n as confirmPasswordReset, o as createUserWithEmailAndPassword, p as debugErrorMap, q as deleteUser, s as fetchSignInMethodsForEmail, t as getAdditionalUserInfo, u as getIdToken, v as getIdTokenResult, w as getMultiFactorResolver, x as inMemoryPersistence, y as initializeRecaptchaConfig, z as isSignInWithEmailLink, B as linkWithCredential, C as multiFactor, D as onAuthStateChanged, H as onIdTokenChanged, I as parseActionCodeURL, J as prodErrorMap, K as reauthenticateWithCredential, L as reload, M as revokeAccessToken, N as sendEmailVerification, Q as sendPasswordResetEmail, R as sendSignInLinkToEmail, U as setPersistence, V as signInAnonymously, W as signInWithCredential, X as signInWithCustomToken, Y as signInWithEmailAndPassword, Z as signInWithEmailLink, _ as signOut, $ as unlink, a0 as updateCurrentUser, a1 as updateEmail, a2 as updatePassword, a3 as updateProfile, a4 as useDeviceLanguage, a5 as validatePassword, a6 as verifyBeforeUpdateEmail, a7 as verifyPasswordResetCode } from './register-Ct10ccti.js';
import { _getProvider, getApp } from '@firebase/app';
import { getDefaultEmulatorHost } from '@firebase/util';
import '@firebase/component';
import '@firebase/logger';

/**
 * @license
 * Copyright 2023 Google LLC
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
// Core functionality shared by all clients
/**
 * Returns the Auth instance associated with the provided {@link @firebase/app#FirebaseApp}.
 * If no instance exists, initializes an Auth instance with platform-specific default dependencies.
 *
 * @param app - The Firebase App.
 *
 * @public
 */
function getAuth(app = getApp()) {
    const provider = _getProvider(app, 'auth');
    if (provider.isInitialized()) {
        return provider.getImmediate();
    }
    const auth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence]
    });
    const authEmulatorHost = getDefaultEmulatorHost('auth');
    if (authEmulatorHost) {
        connectAuthEmulator(auth, `http://${authEmulatorHost}`);
    }
    return auth;
}
registerAuth("WebExtension" /* ClientPlatform.WEB_EXTENSION */);

export { connectAuthEmulator, getAuth, indexedDBLocalPersistence, initializeAuth };
//# sourceMappingURL=index.js.map
