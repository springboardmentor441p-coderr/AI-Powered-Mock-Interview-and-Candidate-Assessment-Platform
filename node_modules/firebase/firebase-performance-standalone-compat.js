!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).firebase=t()}(this,(function(){"use strict";
/**
     * @license
     * Copyright 2025 Google LLC
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
     */const e=function(e){const t=[];let n=0;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=63&i|128):55296==(64512&i)&&r+1<e.length&&56320==(64512&e.charCodeAt(r+1))?(i=65536+((1023&i)<<10)+(1023&e.charCodeAt(++r)),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=63&i|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=63&i|128)}return t},t={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let t=0;t<e.length;t+=3){const i=e[t],a=t+1<e.length,o=a?e[t+1]:0,s=t+2<e.length,c=s?e[t+2]:0,l=i>>2,u=(3&i)<<4|o>>4;let f=(15&o)<<2|c>>6,d=63&c;s||(d=64,a||(f=64)),r.push(n[l],n[u],n[f],n[d])}return r.join("")},encodeString(t,n){return this.HAS_NATIVE_SUPPORT&&!n?btoa(t):this.encodeByteArray(e(t),n)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):function(e){const t=[];let n=0,r=0;for(;n<e.length;){const i=e[n++];if(i<128)t[r++]=String.fromCharCode(i);else if(i>191&&i<224){const a=e[n++];t[r++]=String.fromCharCode((31&i)<<6|63&a)}else if(i>239&&i<365){const a=((7&i)<<18|(63&e[n++])<<12|(63&e[n++])<<6|63&e[n++])-65536;t[r++]=String.fromCharCode(55296+(a>>10)),t[r++]=String.fromCharCode(56320+(1023&a))}else{const a=e[n++],o=e[n++];t[r++]=String.fromCharCode((15&i)<<12|(63&a)<<6|63&o)}}return t.join("")}(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const r=t?this.charToByteMapWebSafe_:this.charToByteMap_,i=[];for(let t=0;t<e.length;){const a=r[e.charAt(t++)],o=t<e.length?r[e.charAt(t)]:0;++t;const s=t<e.length?r[e.charAt(t)]:64;++t;const c=t<e.length?r[e.charAt(t)]:64;if(++t,null==a||null==o||null==s||null==c)throw new n;const l=a<<2|o>>4;if(i.push(l),64!==s){const e=o<<4&240|s>>2;if(i.push(e),64!==c){const e=s<<6&192|c;i.push(e)}}}return i},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};
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
     */class n extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const r=function(n){return function(n){const r=e(n);return t.encodeByteArray(r,!0)}(n).replace(/\./g,"")},i=function(e){try{return t.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};function a(e,t){if(!(t instanceof Object))return t;switch(t.constructor){case Date:return new Date(t.getTime());case Object:void 0===e&&(e={});break;case Array:e=[];break;default:return t}for(const n in t)t.hasOwnProperty(n)&&"__proto__"!==n&&(e[n]=a(e[n],t[n]));return e}
/**
     * @license
     * Copyright 2022 Google LLC
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
const o=()=>
/**
     * @license
     * Copyright 2022 Google LLC
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
function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw new Error("Unable to locate global object.")}().__FIREBASE_DEFAULTS__,s=()=>{try{return o()||(()=>{if("undefined"==typeof process||void 0===process.env)return;const e=process.env.__FIREBASE_DEFAULTS__;return e?JSON.parse(e):void 0})()||(()=>{if("undefined"==typeof document)return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}const t=e&&i(e[1]);return t&&JSON.parse(t)})()}catch(e){return void console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`)}},c=()=>s()?.config
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
     */;class l{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),"function"==typeof e&&(this.promise.catch((()=>{})),1===e.length?e(t):e(t,n))}}}function u(){return"undefined"!=typeof WorkerGlobalScope&&"undefined"!=typeof self&&self instanceof WorkerGlobalScope}function f(){try{return"object"==typeof indexedDB}catch(e){return!1}}function d(){return new Promise(((e,t)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(r),e(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{t(i.error?.message||"")}}catch(e){t(e)}}))}class p extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,p.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,h.prototype.create)}}class h{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},r=`${this.service}/${e}`,i=this.errors[e],a=i?function(e,t){try{let n=0,r="";for(;n<e.length;){const i=e.indexOf("{$",n);if(-1===i){r+=e.substring(n);break}const a=e.indexOf("}",i+2);if(-1===a){r+=e.substring(n);break}const o=e.substring(i+2,a),s=t[o];r+=e.substring(n,i)+(null!=s?String(s):`<${o}?>`),n=a+1}return r}catch(t){return e}}
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
     */(i,n):"Error",o=`${this.serviceName}: ${a} (${r}).`;return new p(r,o,n)}}function g(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function m(e,t){if(e===t)return!0;const n=Object.keys(e),r=Object.keys(t);for(const i of n){if(!r.includes(i))return!1;const n=e[i],a=t[i];if(b(n)&&b(a)){if(!m(n,a))return!1}else if(n!==a)return!1}for(const e of r)if(!n.includes(e))return!1;return!0}function b(e){return null!==e&&"object"==typeof e}
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
     */class v{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}
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
     */const y="[DEFAULT]";
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
     */class _{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const e=new l;if(this.instancesDeferred.set(t,e),this.isInitialized(t)||this.shouldAutoInitialize())try{const n=this.getOrInitializeService({instanceIdentifier:t});n&&e.resolve(n)}catch(e){}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e?.identifier),n=e?.optional??!1;if(!this.isInitialized(t)&&!this.shouldAutoInitialize()){if(n)return null;throw Error(`Service ${this.name} is not available`)}try{return this.getOrInitializeService({instanceIdentifier:t})}catch(e){if(n)return null;throw e}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,this.shouldAutoInitialize()){if(function(e){return"EAGER"===e.instantiationMode}
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
     */(e))try{this.getOrInitializeService({instanceIdentifier:y})}catch(e){}for(const[e,t]of this.instancesDeferred.entries()){const n=this.normalizeInstanceIdentifier(e);try{const e=this.getOrInitializeService({instanceIdentifier:n});t.resolve(e)}catch(e){}}}}clearInstance(e=y){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter((e=>"INTERNAL"in e)).map((e=>e.INTERNAL.delete())),...e.filter((e=>"_delete"in e)).map((e=>e._delete()))])}isComponentSet(){return null!=this.component}isInitialized(e=y){return this.instances.has(e)}getOptions(e=y){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[e,t]of this.instancesDeferred.entries()){n===this.normalizeInstanceIdentifier(e)&&t.resolve(r)}return r}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),r=this.onInitCallbacks.get(n)??new Set;r.add(e),this.onInitCallbacks.set(n,r);const i=this.instances.get(n);return i&&e(i,n),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const r of n)try{r(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:(r=e,r===y?void 0:r),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}var r;return n||null}normalizeInstanceIdentifier(e=y){return this.component?this.component.multipleInstances?e:y:e}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}class w{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new _(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}
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
     */const E=[];var S;!function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"}(S||(S={}));const I={debug:S.DEBUG,verbose:S.VERBOSE,info:S.INFO,warn:S.WARN,error:S.ERROR,silent:S.SILENT},T=S.INFO,C={[S.DEBUG]:"log",[S.VERBOSE]:"log",[S.INFO]:"info",[S.WARN]:"warn",[S.ERROR]:"error"},A=(e,t,...n)=>{if(t<e.logLevel)return;const r=(new Date).toISOString(),i=C[t];if(!i)throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`);console[i](`[${r}]  ${e.name}:`,...n)};class D{constructor(e){this.name=e,this._logLevel=T,this._logHandler=A,this._userLogHandler=null,E.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in S))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"==typeof e?I[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,S.DEBUG,...e),this._logHandler(this,S.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,S.VERBOSE,...e),this._logHandler(this,S.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,S.INFO,...e),this._logHandler(this,S.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,S.WARN,...e),this._logHandler(this,S.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,S.ERROR,...e),this._logHandler(this,S.ERROR,...e)}}let N,k;const O=new WeakMap,M=new WeakMap,L=new WeakMap,P=new WeakMap,B=new WeakMap;let R={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return M.get(e);if("objectStoreNames"===t)return e.objectStoreNames||L.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return x(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function F(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(k||(k=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(U(this),t),x(O.get(this))}:function(...t){return x(e.apply(U(this),t))}:function(t,...n){const r=e.call(U(this),t,...n);return L.set(r,t.sort?t.sort():[t]),x(r)}}function $(e){return"function"==typeof e?F(e):(e instanceof IDBTransaction&&function(e){if(M.has(e))return;const t=new Promise(((t,n)=>{const r=()=>{e.removeEventListener("complete",i),e.removeEventListener("error",a),e.removeEventListener("abort",a)},i=()=>{t(),r()},a=()=>{n(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",i),e.addEventListener("error",a),e.addEventListener("abort",a)}));M.set(e,t)}(e),t=e,(N||(N=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some((e=>t instanceof e))?new Proxy(e,R):e);var t}function x(e){if(e instanceof IDBRequest)return function(e){const t=new Promise(((t,n)=>{const r=()=>{e.removeEventListener("success",i),e.removeEventListener("error",a)},i=()=>{t(x(e.result)),r()},a=()=>{n(e.error),r()};e.addEventListener("success",i),e.addEventListener("error",a)}));return t.then((t=>{t instanceof IDBCursor&&O.set(t,e)})).catch((()=>{})),B.set(t,e),t}(e);if(P.has(e))return P.get(e);const t=$(e);return t!==e&&(P.set(e,t),B.set(t,e)),t}const U=e=>B.get(e);function j(e,t,{blocked:n,upgrade:r,blocking:i,terminated:a}={}){const o=indexedDB.open(e,t),s=x(o);return r&&o.addEventListener("upgradeneeded",(e=>{r(x(o.result),e.oldVersion,e.newVersion,x(o.transaction),e)})),n&&o.addEventListener("blocked",(e=>n(e.oldVersion,e.newVersion,e))),s.then((e=>{a&&e.addEventListener("close",(()=>a())),i&&e.addEventListener("versionchange",(e=>i(e.oldVersion,e.newVersion,e)))})).catch((()=>{})),s}const V=["get","getKey","getAll","getAllKeys","count"],z=["put","add","delete","clear"],H=new Map;function q(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!=typeof t)return;if(H.get(t))return H.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,i=z.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!i&&!V.includes(n))return;const a=async function(e,...t){const a=this.transaction(e,i?"readwrite":"readonly");let o=a.store;return r&&(o=o.index(t.shift())),(await Promise.all([o[n](...t),i&&a.done]))[0]};return H.set(t,a),a}R=(e=>({...e,get:(t,n,r)=>q(t,n)||e.get(t,n,r),has:(t,n)=>!!q(t,n)||e.has(t,n)}))(R);
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
class W{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map((e=>{if(function(e){const t=e.getComponent();return"VERSION"===t?.type}(e)){const t=e.getImmediate();return`${t.library}/${t.version}`}return null})).filter((e=>e)).join(" ")}}const J="@firebase/app",K="0.16.0",G=new D("@firebase/app"),X="@firebase/app-compat",Y="@firebase/analytics-compat",Z="@firebase/analytics",Q="@firebase/app-check-compat",ee="@firebase/app-check",te="@firebase/auth",ne="@firebase/auth-compat",re="@firebase/database",ie="@firebase/data-connect",ae="@firebase/database-compat",oe="@firebase/functions",se="@firebase/functions-compat",ce="@firebase/installations",le="@firebase/installations-compat",ue="@firebase/messaging",fe="@firebase/messaging-compat",de="@firebase/performance",pe="@firebase/performance-compat",he="@firebase/remote-config",ge="@firebase/remote-config-compat",me="@firebase/storage",be="@firebase/storage-compat",ve="@firebase/firestore",ye="@firebase/ai",_e="@firebase/firestore-compat",we="firebase",Ee="[DEFAULT]",Se={[J]:"fire-core",[X]:"fire-core-compat",[Z]:"fire-analytics",[Y]:"fire-analytics-compat",[ee]:"fire-app-check",[Q]:"fire-app-check-compat",[te]:"fire-auth",[ne]:"fire-auth-compat",[re]:"fire-rtdb",[ie]:"fire-data-connect",[ae]:"fire-rtdb-compat",[oe]:"fire-fn",[se]:"fire-fn-compat",[ce]:"fire-iid",[le]:"fire-iid-compat",[ue]:"fire-fcm",[fe]:"fire-fcm-compat",[de]:"fire-perf",[pe]:"fire-perf-compat",[he]:"fire-rc",[ge]:"fire-rc-compat",[me]:"fire-gcs",[be]:"fire-gcs-compat",[ve]:"fire-fst",[_e]:"fire-fst-compat",[ye]:"fire-vertex","fire-js":"fire-js",[we]:"fire-js-all"},Ie=new Map,Te=new Map,Ce=new Map;function Ae(e,t){try{e.container.addComponent(t)}catch(n){G.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function De(e){const t=e.name;if(Ce.has(t))return G.debug(`There were multiple attempts to register component ${t}.`),!1;Ce.set(t,e);for(const t of Ie.values())Ae(t,e);for(const t of Te.values())Ae(t,e);return!0}function Ne(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}function ke(e){return void 0!==e.options}function Oe(e){return!ke(e)&&("authIdToken"in e||"appCheckToken"in e||"releaseOnDeref"in e||"automaticDataCollectionEnabled"in e)}
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
const Me=new h("app","Firebase",{"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."});
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
class Le{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new v("app",(()=>this),"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Me.create("app-deleted",{appName:this._name})}}
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
     */function Pe(e,t){const n=i(e.split(".")[1]);if(null===n)return void console.error(`FirebaseServerApp ${t} is invalid: second part could not be parsed.`);if(void 0===JSON.parse(n).exp)return void console.error(`FirebaseServerApp ${t} is invalid: expiration claim could not be parsed`);1e3*JSON.parse(n).exp-(new Date).getTime()<=0&&console.error(`FirebaseServerApp ${t} is invalid: the token has expired.`)}class Be extends Le{constructor(e,t,n,r){const i=void 0===t.automaticDataCollectionEnabled||t.automaticDataCollectionEnabled,a={name:n,automaticDataCollectionEnabled:i};if(void 0!==e.apiKey)super(e,a,r);else{super(e.options,a,r)}this._serverConfig={automaticDataCollectionEnabled:i,...t},this._serverConfig.authIdToken&&Pe(this._serverConfig.authIdToken,"authIdToken"),this._serverConfig.appCheckToken&&Pe(this._serverConfig.appCheckToken,"appCheckToken"),this._finalizationRegistry=null,"undefined"!=typeof FinalizationRegistry&&(this._finalizationRegistry=new FinalizationRegistry((()=>{this.automaticCleanup()}))),this._refCount=0,this.incRefCount(this._serverConfig.releaseOnDeref),this._serverConfig.releaseOnDeref=void 0,t.releaseOnDeref=void 0,xe(J,K,"serverapp")}toJSON(){}get refCount(){return this._refCount}incRefCount(e){this.isDeleted||(this._refCount++,void 0!==e&&null!==this._finalizationRegistry&&this._finalizationRegistry.register(e,this))}decRefCount(){return this.isDeleted?0:--this._refCount}automaticCleanup(){$e(this)}get settings(){return this.checkDestroyed(),this._serverConfig}checkDestroyed(){if(this.isDeleted)throw Me.create("server-app-deleted")}}
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
     */const Re="12.17.1";function Fe(e,t={}){let n=e;if("object"!=typeof t){t={name:t}}const r={name:Ee,automaticDataCollectionEnabled:!0,...t},i=r.name;if("string"!=typeof i||!i)throw Me.create("bad-app-name",{appName:String(i)});if(n||(n=c()),!n)throw Me.create("no-options");const a=Ie.get(i);if(a){if(m(n,a.options)){if(m(r,a.config))return a;throw Me.create("duplicate-app",{appName:i,mismatchedParam:"config",oldValue:JSON.stringify(a.config),newValue:JSON.stringify(r)})}throw Me.create("duplicate-app",{appName:i,mismatchedParam:"options",oldValue:JSON.stringify(a.options),newValue:JSON.stringify(n)})}const o=new w(i);for(const e of Ce.values())o.addComponent(e);const s=new Le(n,r,o);return Ie.set(i,s),s}async function $e(e){let t=!1;const n=e.name;if(Ie.has(n))t=!0,Ie.delete(n);else if(Te.has(n)){e.decRefCount()<=0&&(Te.delete(n),t=!0)}t&&(await Promise.all(e.container.getProviders().map((e=>e.delete()))),e.isDeleted=!0)}function xe(e,t,n){let r=Se[e]??e;n&&(r+=`-${n}`);const i=r.match(/\s|\//),a=t.match(/\s|\//);if(i||a){const e=[`Unable to register library "${r}" with version "${t}":`];return i&&e.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&a&&e.push("and"),a&&e.push(`version name "${t}" contains illegal characters (whitespace or "/")`),void G.warn(e.join(" "))}De(new v(`${r}-version`,(()=>({library:r,version:t})),"VERSION"))}function Ue(e,t){if(null!==e&&"function"!=typeof e)throw Me.create("invalid-log-argument");!function(e,t){for(const n of E){let r=null;t&&t.level&&(r=I[t.level]),n.userLogHandler=null===e?null:(t,n,...i)=>{const a=i.map((e=>{if(null==e)return null;if("string"==typeof e)return e;if("number"==typeof e||"boolean"==typeof e)return e.toString();if(e instanceof Error)return e.message;try{return JSON.stringify(e)}catch(e){return null}})).filter((e=>e)).join(" ");n>=(r??t.logLevel)&&e({level:S[n].toLowerCase(),message:a,args:i,type:t.name})}}}(e,t)}function je(e){var t;t=e,E.forEach((e=>{e.setLogLevel(t)}))}
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
     */const Ve="firebase-heartbeat-store";let ze=null;function He(){return ze||(ze=j("firebase-heartbeat-database",1,{upgrade:(e,t)=>{if(0===t)try{e.createObjectStore(Ve)}catch(e){console.warn(e)}}}).catch((e=>{throw Me.create("idb-open",{originalErrorMessage:e.message})}))),ze}async function qe(e,t){try{const n=(await He()).transaction(Ve,"readwrite"),r=n.objectStore(Ve);await r.put(t,We(e)),await n.done}catch(e){if(e instanceof p)G.warn(e.message);else{const t=Me.create("idb-set",{originalErrorMessage:e?.message});G.warn(t.message)}}}function We(e){return`${e.name}!${e.options.appId}`}
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
     */class Je{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Ge(t),this._heartbeatsCachePromise=this._storage.read().then((e=>(this._heartbeatsCache=e,e)))}async triggerHeartbeat(){try{const e=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),t=Ke();if(null==this._heartbeatsCache?.heartbeats&&(this._heartbeatsCache=await this._heartbeatsCachePromise,null==this._heartbeatsCache?.heartbeats))return;if(this._heartbeatsCache.lastSentHeartbeatDate===t||this._heartbeatsCache.heartbeats.some((e=>e.date===t)))return;if(this._heartbeatsCache.heartbeats.push({date:t,agent:e}),this._heartbeatsCache.heartbeats.length>30){const e=function(e){if(0===e.length)return-1;let t=0,n=e[0].date;for(let r=1;r<e.length;r++)e[r].date<n&&(n=e[r].date,t=r);return t}
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
     */(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(e,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(e){G.warn(e)}}async getHeartbeatsHeader(){try{if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,null==this._heartbeatsCache?.heartbeats||0===this._heartbeatsCache.heartbeats.length)return"";const e=Ke(),{heartbeatsToSend:t,unsentEntries:n}=function(e,t=1024){const n=[];let r=e.slice();for(const i of e){const e=n.find((e=>e.agent===i.agent));if(e){if(e.dates.push(i.date),Xe(n)>t){e.dates.pop();break}}else if(n.push({agent:i.agent,dates:[i.date]}),Xe(n)>t){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}(this._heartbeatsCache.heartbeats),i=r(JSON.stringify({version:2,heartbeats:t}));return this._heartbeatsCache.lastSentHeartbeatDate=e,n.length>0?(this._heartbeatsCache.heartbeats=n,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(e){return G.warn(e),""}}}function Ke(){return(new Date).toISOString().substring(0,10)}class Ge{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!f()&&d().then((()=>!0)).catch((()=>!1))}async read(){if(await this._canUseIndexedDBPromise){const e=await async function(e){try{const t=(await He()).transaction(Ve),n=await t.objectStore(Ve).get(We(e));return await t.done,n}catch(e){if(e instanceof p)G.warn(e.message);else{const t=Me.create("idb-get",{originalErrorMessage:e?.message});G.warn(t.message)}}}(this.app);return e?.heartbeats?e:{heartbeats:[]}}return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const t=await this.read();return qe(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??t.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){if(await this._canUseIndexedDBPromise){const t=await this.read();return qe(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??t.lastSentHeartbeatDate,heartbeats:[...t.heartbeats,...e.heartbeats]})}}}function Xe(e){return r(JSON.stringify({version:2,heartbeats:e})).length}var Ye;
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
     */Ye="",De(new v("platform-logger",(e=>new W(e)),"PRIVATE")),De(new v("heartbeat",(e=>new Je(e)),"PRIVATE")),xe(J,K,Ye),xe(J,K,"esm2020"),xe("fire-js","");var Ze=Object.freeze({__proto__:null,FirebaseError:p,SDK_VERSION:Re,_DEFAULT_ENTRY_NAME:Ee,_addComponent:Ae,_addOrOverwriteComponent:function(e,t){e.container.addOrOverwriteComponent(t)},_apps:Ie,_clearComponents:function(){Ce.clear()},_components:Ce,_getProvider:Ne,_isFirebaseApp:ke,_isFirebaseServerApp:function(e){return null!=e&&void 0!==e.settings},_isFirebaseServerAppSettings:Oe,_registerComponent:De,_removeServiceInstance:function(e,t,n=Ee){Ne(e,t).clearInstance(n)},_serverApps:Te,deleteApp:$e,getApp:function(e=Ee){const t=Ie.get(e);if(!t&&e===Ee&&c())return Fe();if(!t)throw Me.create("no-app",{appName:e});return t},getApps:function(){return Array.from(Ie.values())},initializeApp:Fe,initializeServerApp:function(e,t={}){if(("undefined"!=typeof window||u())&&!u())throw Me.create("invalid-server-app-environment");let n,r=t||{};if(e&&(ke(e)?n=e.options:Oe(e)?r=e:n=e),void 0===r.automaticDataCollectionEnabled&&(r.automaticDataCollectionEnabled=!0),n||(n=c()),!n)throw Me.create("no-options");const i={...r,...n};if(void 0!==i.releaseOnDeref&&delete i.releaseOnDeref,void 0!==r.releaseOnDeref&&"undefined"==typeof FinalizationRegistry)throw Me.create("finalization-registry-not-supported",{});const a=""+(e=>[...e].reduce(((e,t)=>Math.imul(31,e)+t.charCodeAt(0)|0),0))(JSON.stringify(i)),o=Te.get(a);if(o)return o.incRefCount(r.releaseOnDeref),o;const s=new w(a);for(const e of Ce.values())s.addComponent(e);const l=new Be(n,r,a,s);return Te.set(a,l),l},onLog:Ue,registerVersion:xe,setLogLevel:je});
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
     */class Qe{constructor(e,t){this._delegate=e,this.firebase=t,Ae(e,new v("app-compat",(()=>this),"PUBLIC"))}get automaticDataCollectionEnabled(){return this._delegate.automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.automaticDataCollectionEnabled=e}get name(){return this._delegate.name}get options(){return this._delegate.options}delete(){return this.firebase.INTERNAL.removeApp(this.name),$e(this._delegate)}_getService(e,t=Ee){return this._delegate.checkDestroyed(),this._delegate.container.getProvider(e).getImmediate({identifier:t})}}
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
     */const et=new h("app-compat","Firebase",{"no-app":"No Firebase App '{$appName}' has been created - call Firebase App.initializeApp()","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance."});
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
function tt(e){const t={},n={__esModule:!0,initializeApp:function(r,i={}){const a=Fe(r,i);if(g(t,a.name))return t[a.name];const o=new e(a,n);return t[a.name]=o,o},app:r,registerVersion:xe,setLogLevel:je,onLog:Ue,apps:null,SDK_VERSION:Re,INTERNAL:{registerComponent:function(t){const i=t.name,o=i.replace("-compat","");if(De(t)&&"PUBLIC"===t.type){const s=(e=r())=>{if("function"!=typeof e[o])throw et.create("invalid-app-argument",{appName:i});return e[o]()};void 0!==t.serviceProps&&a(s,t.serviceProps),n[o]=s,e.prototype[o]=function(...e){return this._getService.bind(this,i).apply(this,t.multipleInstances?e:[])}}return"PUBLIC"===t.type?n[o]:null},removeApp:function(e){delete t[e]},useAsService:function(e,t){if("serverAuth"===t)return null;return t},modularAPIs:Ze}};function r(e){if(!g(t,e=e||Ee))throw et.create("no-app",{appName:e});return t[e]}return n.default=n,Object.defineProperty(n,"apps",{get:function(){return Object.keys(t).map((e=>t[e]))}}),r.App=e,n}
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
const nt=function(){const e=tt(Qe);e.SDK_VERSION=`${e.SDK_VERSION}_LITE`;const t=e.INTERNAL.registerComponent;return e.INTERNAL.registerComponent=function(e){if("PUBLIC"===e.type&&!e.name.includes("performance")&&!e.name.includes("installations"))throw Error(`${name} cannot register with the standalone perf instance`);return t(e)},e}();!
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
function(e){xe("@firebase/app-compat","0.5.16",e)}("lite");
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
nt.registerVersion("firebase","12.17.1","app-compat");var rt,it,at=function(){var e=self.performance&&performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(e&&e.responseStart>0&&e.responseStart<performance.now())return e},ot=function(e){if("loading"===document.readyState)return"loading";var t=at();if(t){if(e<t.domInteractive)return"loading";if(0===t.domContentLoadedEventStart||e<t.domContentLoadedEventStart)return"dom-interactive";if(0===t.domComplete||e<t.domComplete)return"dom-content-loaded"}return"complete"},st=function(e){var t=e.nodeName;return 1===e.nodeType?t.toLowerCase():t.toUpperCase().replace(/^#/,"")},ct=function(e,t){var n="";try{for(;e&&9!==e.nodeType;){var r=e,i=r.id?"#"+r.id:st(r)+(r.classList&&r.classList.value&&r.classList.value.trim()&&r.classList.value.trim().length?"."+r.classList.value.trim().replace(/\s+/g,"."):"");if(n.length+i.length>(t||100)-1)return n||i;if(n=n?i+">"+n:i,r.id)break;e=r.parentNode}}catch(e){}return n},lt=-1,ut=function(e){addEventListener("pageshow",(function(t){t.persisted&&(lt=t.timeStamp,e(t))}),!0)},ft=function(){var e=at();return e&&e.activationStart||0},dt=function(e,t){var n=at(),r="navigate";return lt>=0?r="back-forward-cache":n&&(document.prerendering||ft()>0?r="prerender":document.wasDiscarded?r="restore":n.type&&(r=n.type.replace(/_/g,"-"))),{name:e,value:void 0===t?-1:t,rating:"good",delta:0,entries:[],id:"v4-".concat(Date.now(),"-").concat(Math.floor(8999999999999*Math.random())+1e12),navigationType:r}},pt=function(e,t,n){try{if(PerformanceObserver.supportedEntryTypes.includes(e)){var r=new PerformanceObserver((function(e){Promise.resolve().then((function(){t(e.getEntries())}))}));return r.observe(Object.assign({type:e,buffered:!0},n||{})),r}}catch(e){}},ht=function(e,t,n,r){var i,a;return function(o){t.value>=0&&(o||r)&&((a=t.value-(i||0))||void 0===i)&&(i=t.value,t.delta=a,t.rating=function(e,t){return e>t[1]?"poor":e>t[0]?"needs-improvement":"good"}(t.value,n),e(t))}},gt=function(e){requestAnimationFrame((function(){return requestAnimationFrame((function(){return e()}))}))},mt=function(e){document.addEventListener("visibilitychange",(function(){"hidden"===document.visibilityState&&e()}))},bt=function(e){var t=!1;return function(){t||(e(),t=!0)}},vt=-1,yt=function(){return"hidden"!==document.visibilityState||document.prerendering?1/0:0},_t=function(e){"hidden"===document.visibilityState&&vt>-1&&(vt="visibilitychange"===e.type?e.timeStamp:0,Et())},wt=function(){addEventListener("visibilitychange",_t,!0),addEventListener("prerenderingchange",_t,!0)},Et=function(){removeEventListener("visibilitychange",_t,!0),removeEventListener("prerenderingchange",_t,!0)},St=function(){return vt<0&&(vt=yt(),wt(),ut((function(){setTimeout((function(){vt=yt(),wt()}),0)}))),{get firstHiddenTime(){return vt}}},It=function(e){document.prerendering?addEventListener("prerenderingchange",(function(){return e()}),!0):e()},Tt=[1800,3e3],Ct=[.1,.25],At=function(e,t){!function(e,t){t=t||{},function(e,t){t=t||{},It((function(){var n,r=St(),i=dt("FCP"),a=pt("paint",(function(e){e.forEach((function(e){"first-contentful-paint"===e.name&&(a.disconnect(),e.startTime<r.firstHiddenTime&&(i.value=Math.max(e.startTime-ft(),0),i.entries.push(e),n(!0)))}))}));a&&(n=ht(e,i,Tt,t.reportAllChanges),ut((function(r){i=dt("FCP"),n=ht(e,i,Tt,t.reportAllChanges),gt((function(){i.value=performance.now()-r.timeStamp,n(!0)}))})))}))}(bt((function(){var n,r=dt("CLS",0),i=0,a=[],o=function(e){e.forEach((function(e){if(!e.hadRecentInput){var t=a[0],n=a[a.length-1];i&&e.startTime-n.startTime<1e3&&e.startTime-t.startTime<5e3?(i+=e.value,a.push(e)):(i=e.value,a=[e])}})),i>r.value&&(r.value=i,r.entries=a,n())},s=pt("layout-shift",o);s&&(n=ht(e,r,Ct,t.reportAllChanges),mt((function(){o(s.takeRecords()),n(!0)})),ut((function(){i=0,r=dt("CLS",0),n=ht(e,r,Ct,t.reportAllChanges),gt((function(){return n()}))})),setTimeout(n,0))})))}((function(t){var n=function(e){var t,n={};if(e.entries.length){var r=e.entries.reduce((function(e,t){return e&&e.value>t.value?e:t}));if(r&&r.sources&&r.sources.length){var i=(t=r.sources).find((function(e){return e.node&&1===e.node.nodeType}))||t[0];i&&(n={largestShiftTarget:ct(i.node),largestShiftTime:r.startTime,largestShiftValue:r.value,largestShiftSource:i,largestShiftEntry:r,loadState:ot(r.startTime)})}}return Object.assign(e,{attribution:n})}(t);e(n)}),t)},Dt=0,Nt=1/0,kt=0,Ot=function(e){e.forEach((function(e){e.interactionId&&(Nt=Math.min(Nt,e.interactionId),kt=Math.max(kt,e.interactionId),Dt=kt?(kt-Nt)/7+1:0)}))},Mt=function(){return rt?Dt:performance.interactionCount||0},Lt=function(){"interactionCount"in performance||rt||(rt=pt("event",Ot,{type:"event",buffered:!0,durationThreshold:0}))},Pt=[],Bt=new Map,Rt=0,Ft=[],$t=function(e){if(Ft.forEach((function(t){return t(e)})),e.interactionId||"first-input"===e.entryType){var t=Pt[Pt.length-1],n=Bt.get(e.interactionId);if(n||Pt.length<10||e.duration>t.latency){if(n)e.duration>n.latency?(n.entries=[e],n.latency=e.duration):e.duration===n.latency&&e.startTime===n.entries[0].startTime&&n.entries.push(e);else{var r={id:e.interactionId,latency:e.duration,entries:[e]};Bt.set(r.id,r),Pt.push(r)}Pt.sort((function(e,t){return t.latency-e.latency})),Pt.length>10&&Pt.splice(10).forEach((function(e){return Bt.delete(e.id)}))}}},xt=function(e){var t=self.requestIdleCallback||self.setTimeout,n=-1;return e=bt(e),"hidden"===document.visibilityState?e():(n=t(e),mt(e)),n},Ut=[200,500],jt=function(e,t){"PerformanceEventTiming"in self&&"interactionId"in PerformanceEventTiming.prototype&&(t=t||{},It((function(){var n;Lt();var r,i=dt("INP"),a=function(e){xt((function(){e.forEach($t);var t=function(){var e=Math.min(Pt.length-1,Math.floor((Mt()-Rt)/50));return Pt[e]}();t&&t.latency!==i.value&&(i.value=t.latency,i.entries=t.entries,r())}))},o=pt("event",a,{durationThreshold:null!==(n=t.durationThreshold)&&void 0!==n?n:40});r=ht(e,i,Ut,t.reportAllChanges),o&&(o.observe({type:"first-input",buffered:!0}),mt((function(){a(o.takeRecords()),r(!0)})),ut((function(){Rt=Mt(),Pt.length=0,Bt.clear(),i=dt("INP"),r=ht(e,i,Ut,t.reportAllChanges)})))})))},Vt=[],zt=[],Ht=0,qt=new WeakMap,Wt=new Map,Jt=-1,Kt=function(e){Vt=Vt.concat(e),Gt()},Gt=function(){Jt<0&&(Jt=xt(Xt))},Xt=function(){Wt.size>10&&Wt.forEach((function(e,t){Bt.has(t)||Wt.delete(t)}));var e=Pt.map((function(e){return qt.get(e.entries[0])})),t=zt.length-50;zt=zt.filter((function(n,r){return r>=t||e.includes(n)}));for(var n=new Set,r=0;r<zt.length;r++){var i=zt[r];Yt(i.startTime,i.processingEnd).forEach((function(e){n.add(e)}))}var a=Vt.length-1-50;Vt=Vt.filter((function(e,t){return e.startTime>Ht&&t>a||n.has(e)})),Jt=-1};Ft.push((function(e){e.interactionId&&e.target&&!Wt.has(e.interactionId)&&Wt.set(e.interactionId,e.target)}),(function(e){var t,n=e.startTime+e.duration;Ht=Math.max(Ht,e.processingEnd);for(var r=zt.length-1;r>=0;r--){var i=zt[r];if(Math.abs(n-i.renderTime)<=8){(t=i).startTime=Math.min(e.startTime,t.startTime),t.processingStart=Math.min(e.processingStart,t.processingStart),t.processingEnd=Math.max(e.processingEnd,t.processingEnd),t.entries.push(e);break}}t||(t={startTime:e.startTime,processingStart:e.processingStart,processingEnd:e.processingEnd,renderTime:n,entries:[e]},zt.push(t)),(e.interactionId||"first-input"===e.entryType)&&qt.set(e,t),Gt()}));var Yt=function(e,t){for(var n,r=[],i=0;n=Vt[i];i++)if(!(n.startTime+n.duration<e)){if(n.startTime>t)break;r.push(n)}return r},Zt=function(e,t){it||(it=pt("long-animation-frame",Kt)),jt((function(t){var n=function(e){var t=e.entries[0],n=qt.get(t),r=t.processingStart,i=n.processingEnd,a=n.entries.sort((function(e,t){return e.processingStart-t.processingStart})),o=Yt(t.startTime,i),s=e.entries.find((function(e){return e.target})),c=s&&s.target||Wt.get(t.interactionId),l=[t.startTime+t.duration,i].concat(o.map((function(e){return e.startTime+e.duration}))),u=Math.max.apply(Math,l),f={interactionTarget:ct(c),interactionTargetElement:c,interactionType:t.name.startsWith("key")?"keyboard":"pointer",interactionTime:t.startTime,nextPaintTime:u,processedEventEntries:a,longAnimationFrameEntries:o,inputDelay:r-t.startTime,processingDuration:i-r,presentationDelay:Math.max(u-i,0),loadState:ot(t.startTime)};return Object.assign(e,{attribution:f})}(t);e(n)}),t)},Qt=[2500,4e3],en={},tn=function(e,t){!function(e,t){t=t||{},It((function(){var n,r=St(),i=dt("LCP"),a=function(e){t.reportAllChanges||(e=e.slice(-1)),e.forEach((function(e){e.startTime<r.firstHiddenTime&&(i.value=Math.max(e.startTime-ft(),0),i.entries=[e],n())}))},o=pt("largest-contentful-paint",a);if(o){n=ht(e,i,Qt,t.reportAllChanges);var s=bt((function(){en[i.id]||(a(o.takeRecords()),o.disconnect(),en[i.id]=!0,n(!0))}));["keydown","click"].forEach((function(e){addEventListener(e,(function(){return xt(s)}),{once:!0,capture:!0})})),mt(s),ut((function(r){i=dt("LCP"),n=ht(e,i,Qt,t.reportAllChanges),gt((function(){i.value=performance.now()-r.timeStamp,en[i.id]=!0,n(!0)}))}))}}))}((function(t){var n=function(e){var t={timeToFirstByte:0,resourceLoadDelay:0,resourceLoadDuration:0,elementRenderDelay:e.value};if(e.entries.length){var n=at();if(n){var r=n.activationStart||0,i=e.entries[e.entries.length-1],a=i.url&&performance.getEntriesByType("resource").filter((function(e){return e.name===i.url}))[0],o=Math.max(0,n.responseStart-r),s=Math.max(o,a?(a.requestStart||a.startTime)-r:0),c=Math.max(s,a?a.responseEnd-r:0),l=Math.max(c,i.startTime-r);t={element:ct(i.element),timeToFirstByte:o,resourceLoadDelay:s-o,resourceLoadDuration:c-s,elementRenderDelay:l-c,navigationEntry:n,lcpEntry:i},i.url&&(t.url=i.url),a&&(t.lcpResourceEntry=a)}}return Object.assign(e,{attribution:t})}(t);e(n)}),t)};const nn="@firebase/installations",rn="0.6.23",an=1e4,on=`w:${rn}`,sn="FIS_v2",cn=36e5,ln=new h("installations","Installations",{"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."});function un(e){return e instanceof p&&e.code.includes("request-failed")}
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
     */function fn({projectId:e}){return`https://firebaseinstallations.googleapis.com/v1/projects/${e}/installations`}function dn(e){return{token:e.token,requestStatus:2,expiresIn:(t=e.expiresIn,Number(t.replace("s","000"))),creationTime:Date.now()};var t}async function pn(e,t){const n=(await t.json()).error;return ln.create("request-failed",{requestName:e,serverCode:n.code,serverMessage:n.message,serverStatus:n.status})}function hn({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function gn(e,{refreshToken:t}){const n=hn(e);return n.append("Authorization",function(e){return`${sn} ${e}`}
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
     */(t)),n}async function mn(e){const t=await e();return t.status>=500&&t.status<600?e():t}
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
function bn(e){return new Promise((t=>{setTimeout(t,e)}))}
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
const vn=/^[cdef][\w-]{21}$/;function yn(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const t=function(e){const t=(n=e,btoa(String.fromCharCode(...n)).replace(/\+/g,"-").replace(/\//g,"_"));var n;return t.substr(0,22)}
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
     */(e);return vn.test(t)?t:""}catch{return""}}function _n(e){return`${e.appName}!${e.appId}`}
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
     */const wn=new Map;function En(e,t){const n=_n(e);Sn(n,t),function(e,t){const n=function(){!In&&"BroadcastChannel"in self&&(In=new BroadcastChannel("[Firebase] FID Change"),In.onmessage=e=>{Sn(e.data.key,e.data.fid)});return In}();n&&n.postMessage({key:e,fid:t});0===wn.size&&In&&(In.close(),In=null)}(n,t)}function Sn(e,t){const n=wn.get(e);if(n)for(const e of n)e(t)}let In=null;
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
const Tn="firebase-installations-store";let Cn=null;function An(){return Cn||(Cn=j("firebase-installations-database",1,{upgrade:(e,t)=>{if(0===t)e.createObjectStore(Tn)}})),Cn}async function Dn(e,t){const n=_n(e),r=(await An()).transaction(Tn,"readwrite"),i=r.objectStore(Tn),a=await i.get(n);return await i.put(t,n),await r.done,a&&a.fid===t.fid||En(e,t.fid),t}async function Nn(e){const t=_n(e),n=(await An()).transaction(Tn,"readwrite");await n.objectStore(Tn).delete(t),await n.done}async function kn(e,t){const n=_n(e),r=(await An()).transaction(Tn,"readwrite"),i=r.objectStore(Tn),a=await i.get(n),o=t(a);return void 0===o?await i.delete(n):await i.put(o,n),await r.done,!o||a&&a.fid===o.fid||En(e,o.fid),o}
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
     */async function On(e){let t;const n=await kn(e.appConfig,(n=>{const r=function(e){const t=e||{fid:yn(),registrationStatus:0};return Pn(t)}(n),i=function(e,t){if(0===t.registrationStatus){if(!navigator.onLine){return{installationEntry:t,registrationPromise:Promise.reject(ln.create("app-offline"))}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},r=async function(e,t){try{const n=await async function({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const r=fn(e),i=hn(e),a=t.getImmediate({optional:!0});if(a){const e=await a.getHeartbeatsHeader();e&&i.append("x-firebase-client",e)}const o={fid:n,authVersion:sn,appId:e.appId,sdkVersion:on},s={method:"POST",headers:i,body:JSON.stringify(o)},c=await mn((()=>fetch(r,s)));if(c.ok){const e=await c.json();return{fid:e.fid||n,registrationStatus:2,refreshToken:e.refreshToken,authToken:dn(e.authToken)}}throw await pn("Create Installation",c)}(e,t);return Dn(e.appConfig,n)}catch(n){throw un(n)&&409===n.customData.serverCode?await Nn(e.appConfig):await Dn(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}(e,n);return{installationEntry:n,registrationPromise:r}}return 1===t.registrationStatus?{installationEntry:t,registrationPromise:Mn(e)}:{installationEntry:t}}(e,r);return t=i.registrationPromise,i.installationEntry}));return""===n.fid?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}async function Mn(e){let t=await Ln(e.appConfig);for(;1===t.registrationStatus;)await bn(100),t=await Ln(e.appConfig);if(0===t.registrationStatus){const{installationEntry:t,registrationPromise:n}=await On(e);return n||t}return t}function Ln(e){return kn(e,(e=>{if(!e)throw ln.create("installation-not-found");return Pn(e)}))}function Pn(e){return 1===(t=e).registrationStatus&&t.registrationTime+an<Date.now()?{fid:e.fid,registrationStatus:0}:e;var t;
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
     */}async function Bn({appConfig:e,heartbeatServiceProvider:t},n){const r=function(e,{fid:t}){return`${fn(e)}/${t}/authTokens:generate`}
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
     */(e,n),i=gn(e,n),a=t.getImmediate({optional:!0});if(a){const e=await a.getHeartbeatsHeader();e&&i.append("x-firebase-client",e)}const o={installation:{sdkVersion:on,appId:e.appId}},s={method:"POST",headers:i,body:JSON.stringify(o)},c=await mn((()=>fetch(r,s)));if(c.ok){return dn(await c.json())}throw await pn("Generate Auth Token",c)}async function Rn(e,t=!1){let n;const r=await kn(e.appConfig,(r=>{if(!$n(r))throw ln.create("not-registered");const i=r.authToken;if(!t&&function(e){return 2===e.requestStatus&&!function(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+cn}(e)}(i))return r;if(1===i.requestStatus)return n=async function(e,t){let n=await Fn(e.appConfig);for(;1===n.authToken.requestStatus;)await bn(100),n=await Fn(e.appConfig);const r=n.authToken;return 0===r.requestStatus?Rn(e,t):r}(e,t),r;{if(!navigator.onLine)throw ln.create("app-offline");const t=function(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}(r);return n=async function(e,t){try{const n=await Bn(e,t),r={...t,authToken:n};return await Dn(e.appConfig,r),n}catch(n){if(!un(n)||401!==n.customData.serverCode&&404!==n.customData.serverCode){const n={...t,authToken:{requestStatus:0}};await Dn(e.appConfig,n)}else await Nn(e.appConfig);throw n}}(e,t),t}}));return n?await n:r.authToken}function Fn(e){return kn(e,(e=>{if(!$n(e))throw ln.create("not-registered");const t=e.authToken;return 1===(n=t).requestStatus&&n.requestTime+an<Date.now()?{...e,authToken:{requestStatus:0}}:e;var n;
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
     */}))}function $n(e){return void 0!==e&&2===e.registrationStatus}
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
async function xn(e,t=!1){const n=e;await async function(e){const{registrationPromise:t}=await On(e);t&&await t}
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
     */(n);return(await Rn(n,t)).token}function Un(e){return ln.create("missing-app-config-values",{valueName:e})}
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
     */const jn="installations",Vn=e=>{const t=Ne(e.getProvider("app").getImmediate(),jn).getImmediate();return{getId:()=>async function(e){const t=e,{installationEntry:n,registrationPromise:r}=await On(t);return r?r.catch(console.error):Rn(t).catch(console.error),n.fid}(t),getToken:e=>xn(t,e)}};De(new v(jn,(e=>{const t=e.getProvider("app").getImmediate(),n=function(e){if(!e||!e.options)throw Un("App Configuration");if(!e.name)throw Un("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw Un(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}(t);return{app:t,appConfig:n,heartbeatServiceProvider:Ne(t,"heartbeat"),_delete:()=>Promise.resolve()}}),"PUBLIC")),De(new v("installations-internal",Vn,"PRIVATE")),xe(nn,rn),xe(nn,rn,"esm2020");const zn="@firebase/performance",Hn="0.7.13",qn=Hn,Wn="FB-PERF-TRACE-MEASURE",Jn="_wt_",Kn="_fcp",Gn="_fid",Xn="_lcp",Yn="_inp",Zn="_cls",Qn="@firebase/performance/config",er="@firebase/performance/configexpire",tr="Performance",nr=new h("performance",tr,{"trace started":"Trace {$traceName} was started before.","trace stopped":"Trace {$traceName} is not running.","nonpositive trace startTime":"Trace {$traceName} startTime should be positive.","nonpositive trace duration":"Trace {$traceName} duration should be positive.","no window":"Window is not available.","no app id":"App id is not available.","no project id":"Project id is not available.","no api key":"Api key is not available.","invalid cc log":"Attempted to queue invalid cc event","FB not default":"Performance can only start when Firebase app instance is the default one.","RC response not ok":"RC response is not ok","invalid attribute name":"Attribute name {$attributeName} is invalid.","invalid attribute value":"Attribute value {$attributeValue} is invalid.","invalid custom metric name":"Custom metric name {$customMetricName} is invalid","invalid String merger input":"Input for String merger is invalid, contact support team to resolve.","already initialized":"initializePerformance() has already been called with different options. To avoid this error, call initializePerformance() with the same options as when it was originally called, or call getPerformance() to return the already initialized instance."}),rr=new D(tr);
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
let ir,ar,or,sr;rr.logLevel=S.INFO;class cr{constructor(e){if(this.window=e,!e)throw nr.create("no window");this.performance=e.performance,this.PerformanceObserver=e.PerformanceObserver,this.windowLocation=e.location,this.navigator=e.navigator,this.document=e.document,this.navigator&&this.navigator.cookieEnabled&&(this.localStorage=e.localStorage),e.perfMetrics&&e.perfMetrics.onFirstInputDelay&&(this.onFirstInputDelay=e.perfMetrics.onFirstInputDelay),this.onLCP=tn,this.onINP=Zt,this.onCLS=At}getUrl(){return this.windowLocation.href.split("?")[0]}mark(e){this.performance&&this.performance.mark&&this.performance.mark(e)}measure(e,t,n){this.performance&&this.performance.measure&&this.performance.measure(e,t,n)}getEntriesByType(e){return this.performance&&this.performance.getEntriesByType?this.performance.getEntriesByType(e):[]}getEntriesByName(e){return this.performance&&this.performance.getEntriesByName?this.performance.getEntriesByName(e):[]}getTimeOrigin(){return this.performance&&(this.performance.timeOrigin||this.performance.timing.navigationStart)}requiredApisAvailable(){return fetch&&Promise&&"undefined"!=typeof navigator&&navigator.cookieEnabled?!!f()||(rr.info("IndexedDB is not supported by current browser"),!1):(rr.info("Firebase Performance cannot start if browser does not support fetch and Promise or cookie is disabled."),!1)}setupObserver(e,t){if(!this.PerformanceObserver)return;new this.PerformanceObserver((e=>{for(const n of e.getEntries())t(n)})).observe({entryTypes:[e]})}static getInstance(){return void 0===ir&&(ir=new cr(ar)),ir}}function lr(){return or}
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
function ur(e,t){const n=e.length-t.length;if(n<0||n>1)throw nr.create("invalid String merger input");const r=[];for(let n=0;n<e.length;n++)r.push(e.charAt(n)),t.length>n&&r.push(t.charAt(n));return r.join("")}
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
     */class fr{constructor(){this.instrumentationEnabled=!0,this.dataCollectionEnabled=!0,this.loggingEnabled=!1,this.tracesSamplingRate=1,this.networkRequestsSamplingRate=1,this.logEndPointUrl="https://firebaselogging.googleapis.com/v0cc/log?format=json_proto",this.flTransportEndpointUrl=ur("hts/frbslgigp.ogepscmv/ieo/eaylg","tp:/ieaeogn-agolai.o/1frlglgc/o"),this.transportKey=ur("AzSC8r6ReiGqFMyfvgow","Iayx0u-XT3vksVM-pIV"),this.logSource=462,this.logTraceAfterSampling=!1,this.logNetworkAfterSampling=!1,this.configTimeToLive=12,this.logMaxFlushSize=40}getFlTransportFullUrl(){return this.flTransportEndpointUrl.concat("?key=",this.transportKey)}static getInstance(){return void 0===sr&&(sr=new fr),sr}}
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
     */var dr;!function(e){e[e.UNKNOWN=0]="UNKNOWN",e[e.VISIBLE=1]="VISIBLE",e[e.HIDDEN=2]="HIDDEN"}(dr||(dr={}));const pr=["firebase_","google_","ga_"],hr=new RegExp("^[a-zA-Z]\\w*$");function gr(){const e=cr.getInstance().navigator;return e?.serviceWorker?e.serviceWorker.controller?2:3:1}function mr(){switch(cr.getInstance().document.visibilityState){case"visible":return dr.VISIBLE;case"hidden":return dr.HIDDEN;default:return dr.UNKNOWN}}function br(){const e=cr.getInstance().navigator.connection;switch(e&&e.effectiveType){case"slow-2g":return 1;case"2g":return 2;case"3g":return 3;case"4g":return 4;default:return 0}}
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
function vr(e){const t=e.options?.appId;if(!t)throw nr.create("no app id");return t}
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
const yr="0.0.1",_r={loggingEnabled:!0},wr="FIREBASE_INSTALLATIONS_AUTH";function Er(e,t){const n=function(){const e=cr.getInstance().localStorage;if(!e)return;const t=e.getItem(er);if(!(t&&(n=t,Number(n)>Date.now())))return;var n;const r=e.getItem(Qn);if(!r)return;try{return JSON.parse(r)}catch{return}}();return n?(Ir(n),Promise.resolve()):function(e,t){return function(e){const t=e.getToken();return t.then((e=>{})),t}(e.installations).then((n=>{const r=function(e){const t=e.options?.projectId;if(!t)throw nr.create("no project id");return t}(e.app),i=function(e){const t=e.options?.apiKey;if(!t)throw nr.create("no api key");return t}(e.app),a=new Request(`https://firebaseremoteconfig.googleapis.com/v1/projects/${r}/namespaces/fireperf:fetch?key=${i}`,{method:"POST",headers:{Authorization:`${wr} ${n}`},body:JSON.stringify({app_instance_id:t,app_instance_id_token:n,app_id:vr(e.app),app_version:qn,sdk_version:yr})});return fetch(a).then((e=>{if(e.ok)return e.json();throw nr.create("RC response not ok")}))})).catch((()=>{rr.info(Sr)}))}(e,t).then(Ir).then((e=>function(e){const t=cr.getInstance().localStorage;if(!e||!t)return;t.setItem(Qn,JSON.stringify(e)),t.setItem(er,String(Date.now()+60*fr.getInstance().configTimeToLive*60*1e3))}(e)),(()=>{}))}const Sr="Could not fetch config, will use default configs";function Ir(e){if(!e)return e;const t=fr.getInstance(),n=e.entries||{};return void 0!==n.fpr_enabled?t.loggingEnabled="true"===String(n.fpr_enabled):t.loggingEnabled=_r.loggingEnabled,n.fpr_log_source?t.logSource=Number(n.fpr_log_source):_r.logSource&&(t.logSource=_r.logSource),n.fpr_log_endpoint_url?t.logEndPointUrl=n.fpr_log_endpoint_url:_r.logEndPointUrl&&(t.logEndPointUrl=_r.logEndPointUrl),n.fpr_log_transport_key?t.transportKey=n.fpr_log_transport_key:_r.transportKey&&(t.transportKey=_r.transportKey),void 0!==n.fpr_vc_network_request_sampling_rate?t.networkRequestsSamplingRate=Number(n.fpr_vc_network_request_sampling_rate):void 0!==_r.networkRequestsSamplingRate&&(t.networkRequestsSamplingRate=_r.networkRequestsSamplingRate),void 0!==n.fpr_vc_trace_sampling_rate?t.tracesSamplingRate=Number(n.fpr_vc_trace_sampling_rate):void 0!==_r.tracesSamplingRate&&(t.tracesSamplingRate=_r.tracesSamplingRate),n.fpr_log_max_flush_size?t.logMaxFlushSize=Number(n.fpr_log_max_flush_size):_r.logMaxFlushSize&&(t.logMaxFlushSize=_r.logMaxFlushSize),t.logTraceAfterSampling=Tr(t.tracesSamplingRate),t.logNetworkAfterSampling=Tr(t.networkRequestsSamplingRate),e}function Tr(e){return Math.random()<=e}
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
     */let Cr,Ar=1;function Dr(e){return Ar=2,Cr=Cr||function(e){return function(){const e=cr.getInstance().document;return new Promise((t=>{if(e&&"complete"!==e.readyState){const n=()=>{"complete"===e.readyState&&(e.removeEventListener("readystatechange",n),t())};e.addEventListener("readystatechange",n)}else t()}))}().then((()=>function(e){const t=e.getId();return t.then((e=>{or=e})),t}(e.installations))).then((t=>Er(e,t))).then((()=>Nr()),(()=>Nr()))}(e),Cr}function Nr(){Ar=3}
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
     */const kr=1e4,Or=new TextEncoder;let Mr,Lr=3,Pr=[],Br=!1;function Rr(e){setTimeout((()=>{Lr<=0||(Pr.length>0&&function(){const e=Pr.splice(0,1e3);(function(e){const t=fr.getInstance().getFlTransportFullUrl();return Or.encode(e).length<=65536&&navigator.sendBeacon&&navigator.sendBeacon(t,e)?Promise.resolve():fetch(t,{method:"POST",body:e})})(Fr(e)).then((()=>{Lr=3})).catch((()=>{Pr=[...e,...Pr],Lr--,rr.info(`Tries left: ${Lr}.`),Rr(kr)}))}(),Rr(kr))}),e)}function Fr(e){const t=e.map((e=>({source_extension_json_proto3:e.message,event_time_ms:String(e.eventTime)}))),n={request_time_ms:String(Date.now()),client_info:{client_type:1,js_client_info:{}},log_source:fr.getInstance().logSource,log_event:t};return JSON.stringify(n)}function $r(e){return(...t)=>{!function(e){if(!e.eventTime||!e.message)throw nr.create("invalid cc log");Pr=[...Pr,e]}({message:e(...t),eventTime:Date.now()})}}function xr(){const e=fr.getInstance().getFlTransportFullUrl();for(;Pr.length>0;){const t=Pr.splice(-fr.getInstance().logMaxFlushSize),n=Fr(t);if(!navigator.sendBeacon||!navigator.sendBeacon(e,n)){Pr=[...Pr,...t];break}}if(Pr.length>0){const t=Fr(Pr);fetch(e,{method:"POST",body:t}).catch((()=>{rr.info("Failed flushing queued events.")}))}}
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
     */function Ur(e,t){Mr||(Mr={send:$r(zr),flush:xr}),Mr.send(e,t)}function jr(e){const t=fr.getInstance();!t.instrumentationEnabled&&e.isAuto||(t.dataCollectionEnabled||e.isAuto)&&cr.getInstance().requiredApisAvailable()&&(3===Ar?Vr(e):Dr(e.performanceController).then((()=>Vr(e)),(()=>Vr(e))))}function Vr(e){if(!lr())return;const t=fr.getInstance();t.loggingEnabled&&t.logTraceAfterSampling&&Ur(e,1)}function zr(e,t){return 0===t?function(e){const t={url:e.url,http_method:e.httpMethod||0,http_response_code:200,response_payload_bytes:e.responsePayloadBytes,client_start_time_us:e.startTimeUs,time_to_response_initiated_us:e.timeToResponseInitiatedUs,time_to_response_completed_us:e.timeToResponseCompletedUs},n={application_info:Hr(e.performanceController.app),network_request_metric:t};return JSON.stringify(n)}(e):function(e){const t={name:e.name,is_auto:e.isAuto,client_start_time_us:e.startTimeUs,duration_us:e.durationUs};0!==Object.keys(e.counters).length&&(t.counters=e.counters);const n=e.getAttributes();0!==Object.keys(n).length&&(t.custom_attributes=n);const r={application_info:Hr(e.performanceController.app),trace_metric:t};return JSON.stringify(r)}(e)}function Hr(e){return{google_app_id:vr(e),app_instance_id:lr(),web_app_info:{sdk_version:qn,page_url:cr.getInstance().getUrl(),service_worker_status:gr(),visibility_state:mr(),effective_connection_type:br()},application_process_state:0}}
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
     */function qr(e,t){const n=t;if(!n||void 0===n.responseStart)return;const r=cr.getInstance().getTimeOrigin(),i=Math.floor(1e3*(n.startTime+r)),a=n.responseStart?Math.floor(1e3*(n.responseStart-n.startTime)):void 0,o=Math.floor(1e3*(n.responseEnd-n.startTime));!function(e){const t=fr.getInstance();if(!t.instrumentationEnabled)return;const n=e.url,r=t.logEndPointUrl.split("?")[0],i=t.flTransportEndpointUrl.split("?")[0];n!==r&&n!==i&&t.loggingEnabled&&t.logNetworkAfterSampling&&Ur(e,0)}({performanceController:e,url:n.name&&n.name.split("?")[0],responsePayloadBytes:n.transferSize,startTimeUs:i,timeToResponseInitiatedUs:a,timeToResponseCompletedUs:o})}
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
     */const Wr=["_fp",Kn,Gn,Xn,Zn,Yn];
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
class Jr{constructor(e,t,n=!1,r){this.performanceController=e,this.name=t,this.isAuto=n,this.state=1,this.customAttributes={},this.counters={},this.api=cr.getInstance(),this.randomId=Math.floor(1e6*Math.random()),this.isAuto||(this.traceStartMark=`FB-PERF-TRACE-START-${this.randomId}-${this.name}`,this.traceStopMark=`FB-PERF-TRACE-STOP-${this.randomId}-${this.name}`,this.traceMeasure=r||`${Wn}-${this.randomId}-${this.name}`,r&&this.calculateTraceMetrics())}start(){if(1!==this.state)throw nr.create("trace started",{traceName:this.name});this.api.mark(this.traceStartMark),this.state=2}stop(){if(2!==this.state)throw nr.create("trace stopped",{traceName:this.name});this.state=3,this.api.mark(this.traceStopMark),this.api.measure(this.traceMeasure,this.traceStartMark,this.traceStopMark),this.calculateTraceMetrics(),jr(this)}record(e,t,n){if(e<=0)throw nr.create("nonpositive trace startTime",{traceName:this.name});if(t<=0)throw nr.create("nonpositive trace duration",{traceName:this.name});if(this.durationUs=Math.floor(1e3*t),this.startTimeUs=Math.floor(1e3*e),n&&n.attributes&&(this.customAttributes={...n.attributes}),n&&n.metrics)for(const e of Object.keys(n.metrics))isNaN(Number(n.metrics[e]))||(this.counters[e]=Math.floor(Number(n.metrics[e])));jr(this)}incrementMetric(e,t=1){void 0===this.counters[e]?this.putMetric(e,t):this.putMetric(e,this.counters[e]+t)}putMetric(e,t){if(!function(e,t){return!(0===e.length||e.length>100)&&(t&&t.startsWith(Jn)&&Wr.indexOf(e)>-1||!e.startsWith("_"))}(e,this.name))throw nr.create("invalid custom metric name",{customMetricName:e});this.counters[e]=function(e){const t=Math.floor(e);return t<e&&rr.info(`Metric value should be an Integer, setting the value as : ${t}.`),t}(t??0)}getMetric(e){return this.counters[e]||0}putAttribute(e,t){const n=function(e){return!(0===e.length||e.length>40)&&(!pr.some((t=>e.startsWith(t)))&&!!e.match(hr))}(e),r=function(e){return 0!==e.length&&e.length<=100}(t);if(n&&r)this.customAttributes[e]=t;else{if(!n)throw nr.create("invalid attribute name",{attributeName:e});if(!r)throw nr.create("invalid attribute value",{attributeValue:t})}}getAttribute(e){return this.customAttributes[e]}removeAttribute(e){void 0!==this.customAttributes[e]&&delete this.customAttributes[e]}getAttributes(){return{...this.customAttributes}}setStartTime(e){this.startTimeUs=e}setDuration(e){this.durationUs=e}calculateTraceMetrics(){const e=this.api.getEntriesByName(this.traceMeasure),t=e&&e[0];t&&(this.durationUs=Math.floor(1e3*t.duration),this.startTimeUs=Math.floor(1e3*(t.startTime+this.api.getTimeOrigin())))}static createOobTrace(e,t,n,r,i){const a=cr.getInstance().getUrl();if(!a)return;const o=new Jr(e,Jn+a,!0),s=Math.floor(1e3*cr.getInstance().getTimeOrigin());o.setStartTime(s),t&&t[0]&&(o.setDuration(Math.floor(1e3*t[0].duration)),o.putMetric("domInteractive",Math.floor(1e3*t[0].domInteractive)),o.putMetric("domContentLoadedEventEnd",Math.floor(1e3*t[0].domContentLoadedEventEnd)),o.putMetric("loadEventEnd",Math.floor(1e3*t[0].loadEventEnd)));if(n){const e=n.find((e=>"first-paint"===e.name));e&&e.startTime&&o.putMetric("_fp",Math.floor(1e3*e.startTime));const t=n.find((e=>"first-contentful-paint"===e.name));t&&t.startTime&&o.putMetric(Kn,Math.floor(1e3*t.startTime)),i&&o.putMetric(Gn,Math.floor(1e3*i))}this.addWebVitalMetric(o,Xn,"lcp_element",r.lcp),this.addWebVitalMetric(o,Zn,"cls_largestShiftTarget",r.cls),this.addWebVitalMetric(o,Yn,"inp_interactionTarget",r.inp),jr(o),Mr&&Mr.flush()}static addWebVitalMetric(e,t,n,r){r&&(e.putMetric(t,Math.floor(1e3*r.value)),r.elementAttribution&&(r.elementAttribution.length>100?e.putAttribute(n,r.elementAttribution.substring(0,100)):e.putAttribute(n,r.elementAttribution)))}static createUserTimingTrace(e,t){jr(new Jr(e,t,!1,t))}}
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
     */let Kr,Gr={},Xr=!1;function Yr(e){lr()&&(setTimeout((()=>function(e){const t=cr.getInstance();"onpagehide"in window?t.document.addEventListener("pagehide",(()=>Qr(e))):t.document.addEventListener("unload",(()=>Qr(e)));t.document.addEventListener("visibilitychange",(()=>{"hidden"===t.document.visibilityState&&Qr(e)})),t.onFirstInputDelay&&t.onFirstInputDelay((e=>{Kr=e}));t.onLCP((e=>{Gr.lcp={value:e.value,elementAttribution:e.attribution?.element}})),t.onCLS((e=>{Gr.cls={value:e.value,elementAttribution:e.attribution?.largestShiftTarget}})),t.onINP((e=>{Gr.inp={value:e.value,elementAttribution:e.attribution?.interactionTarget}}))}(e)),0),setTimeout((()=>function(e){const t=cr.getInstance(),n=t.getEntriesByType("resource");for(const t of n)qr(e,t);t.setupObserver("resource",(t=>qr(e,t)))}(e)),0),setTimeout((()=>function(e){const t=cr.getInstance(),n=t.getEntriesByType("measure");for(const t of n)Zr(e,t);t.setupObserver("measure",(t=>Zr(e,t)))}(e)),0))}function Zr(e,t){const n=t.name;n.substring(0,21)!==Wn&&Jr.createUserTimingTrace(e,n)}function Qr(e){if(!Xr){Xr=!0;const t=cr.getInstance(),n=t.getEntriesByType("navigation"),r=t.getEntriesByType("paint");setTimeout((()=>{Jr.createOobTrace(e,n,r,Gr,Kr)}),0)}}
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
     */class ei{constructor(e,t){this.app=e,this.installations=t,this.initialized=!1}_init(e){this.initialized||(void 0!==e?.dataCollectionEnabled&&(this.dataCollectionEnabled=e.dataCollectionEnabled),void 0!==e?.instrumentationEnabled&&(this.instrumentationEnabled=e.instrumentationEnabled),cr.getInstance().requiredApisAvailable()?d().then((e=>{e&&(Br||(Rr(5500),Br=!0),Dr(this).then((()=>Yr(this)),(()=>Yr(this))),this.initialized=!0)})).catch((e=>{rr.info(`Environment doesn't support IndexedDB: ${e}`)})):rr.info('Firebase Performance cannot start if the browser does not support "Fetch" and "Promise", or cookies are disabled.'))}set instrumentationEnabled(e){fr.getInstance().instrumentationEnabled=e}get instrumentationEnabled(){return fr.getInstance().instrumentationEnabled}set dataCollectionEnabled(e){fr.getInstance().dataCollectionEnabled=e}get dataCollectionEnabled(){return fr.getInstance().dataCollectionEnabled}}De(new v("performance",((e,{options:t})=>{const n=e.getProvider("app").getImmediate(),r=e.getProvider("installations-internal").getImmediate();if("[DEFAULT]"!==n.name)throw nr.create("FB not default");if("undefined"==typeof window)throw nr.create("no window");!function(e){ar=e}
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
     */(window);const i=new ei(n,r);return i._init(t),i}),"PUBLIC")),xe(zn,Hn),xe(zn,Hn,"esm2020");
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
class ti{constructor(e,t){this.app=e,this._delegate=t}get instrumentationEnabled(){return this._delegate.instrumentationEnabled}set instrumentationEnabled(e){this._delegate.instrumentationEnabled=e}get dataCollectionEnabled(){return this._delegate.dataCollectionEnabled}set dataCollectionEnabled(e){this._delegate.dataCollectionEnabled=e}trace(e){return function(e,t){var n;return e=(n=e)&&n._delegate?n._delegate:n,new Jr(e,t)}(this._delegate,e)}}function ni(e){const t=e.getProvider("app-compat").getImmediate(),n=e.getProvider("performance").getImmediate();return new ti(t,n)}
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
var ri;(ri=nt).INTERNAL.registerComponent(new v("performance-compat",ni,"PUBLIC")),ri.registerVersion("@firebase/performance-compat","0.2.26");
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
return nt.registerVersion("firebase","12.17.1","compat-lite"),nt}));
//# sourceMappingURL=firebase-performance-standalone-compat.js.map
