'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var appCheck = require('@firebase/app-check');



Object.keys(appCheck).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return appCheck[k]; }
	});
});
//# sourceMappingURL=index.cjs.js.map
