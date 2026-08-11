'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var auth = require('@firebase/auth');



Object.keys(auth).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return auth[k]; }
	});
});
//# sourceMappingURL=index.cjs.js.map
