'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var functions = require('@firebase/functions');



Object.keys(functions).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return functions[k]; }
	});
});
//# sourceMappingURL=index.cjs.js.map
