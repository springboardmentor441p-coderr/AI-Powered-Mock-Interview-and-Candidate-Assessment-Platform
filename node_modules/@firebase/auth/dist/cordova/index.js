import { _getProvider, getApp } from '@firebase/app';
import { _ as _linkWithRedirect, a as _reauthenticateWithRedirect, b as _signInWithRedirect, r as registerAuth, i as initializeAuth, c as cordovaPopupRedirectResolver, d as indexedDBLocalPersistence } from './popup_redirect-B-tPyF2Y.js';
export { A as ActionCodeOperation, e as ActionCodeURL, f as AuthCredential, g as AuthErrorCodes, E as EmailAuthCredential, h as EmailAuthProvider, F as FacebookAuthProvider, j as FactorId, G as GithubAuthProvider, k as GoogleAuthProvider, O as OAuthCredential, l as OAuthProvider, m as OperationType, P as PhoneAuthCredential, n as ProviderId, S as SAMLAuthProvider, o as SignInMethod, T as TwitterAuthProvider, p as applyActionCode, q as beforeAuthStateChanged, s as browserLocalPersistence, t as browserSessionPersistence, u as checkActionCode, v as confirmPasswordReset, w as connectAuthEmulator, x as createUserWithEmailAndPassword, y as debugErrorMap, z as deleteUser, B as fetchSignInMethodsForEmail, C as getAdditionalUserInfo, D as getIdToken, H as getIdTokenResult, I as getMultiFactorResolver, J as getRedirectResult, K as inMemoryPersistence, L as initializeRecaptchaConfig, M as isSignInWithEmailLink, N as linkWithCredential, Q as multiFactor, R as onAuthStateChanged, U as onIdTokenChanged, V as parseActionCodeURL, W as prodErrorMap, X as reauthenticateWithCredential, Y as reload, Z as revokeAccessToken, $ as sendEmailVerification, a0 as sendPasswordResetEmail, a1 as sendSignInLinkToEmail, a2 as setPersistence, a3 as signInAnonymously, a4 as signInWithCredential, a5 as signInWithCustomToken, a6 as signInWithEmailAndPassword, a7 as signInWithEmailLink, a8 as signOut, a9 as unlink, aa as updateCurrentUser, ab as updateEmail, ac as updatePassword, ad as updateProfile, ae as useDeviceLanguage, af as validatePassword, ag as verifyBeforeUpdateEmail, ah as verifyPasswordResetCode } from './popup_redirect-B-tPyF2Y.js';
import '@firebase/util';
import '@firebase/component';
import '@firebase/logger';

/**
 * @license
 * Copyright 2021 Google LLC
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
function signInWithRedirect(auth, provider, resolver) {
    return _signInWithRedirect(auth, provider, resolver);
}
function reauthenticateWithRedirect(user, provider, resolver) {
    return _reauthenticateWithRedirect(user, provider, resolver);
}
function linkWithRedirect(user, provider, resolver) {
    return _linkWithRedirect(user, provider, resolver);
}

/**
 * @license
 * Copyright 2021 Google LLC
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
 * This is the file that people using Cordova will actually import. You
 * should only include this file if you have something specific about your
 * implementation that mandates having a separate entrypoint. Otherwise you can
 * just use index.ts
 */
function getAuth(app = getApp()) {
    const provider = _getProvider(app, 'auth');
    if (provider.isInitialized()) {
        return provider.getImmediate();
    }
    return initializeAuth(app, {
        persistence: indexedDBLocalPersistence,
        popupRedirectResolver: cordovaPopupRedirectResolver
    });
}
registerAuth("Cordova" /* ClientPlatform.CORDOVA */);

export { cordovaPopupRedirectResolver, getAuth, indexedDBLocalPersistence, initializeAuth, linkWithRedirect, reauthenticateWithRedirect, signInWithRedirect };
//# sourceMappingURL=index.js.map
