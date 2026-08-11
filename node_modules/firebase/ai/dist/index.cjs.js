'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ai = require('@firebase/ai');



Object.keys(ai).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return ai[k]; }
	});
});
//# sourceMappingURL=index.cjs.js.map
