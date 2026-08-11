'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var performance = require('@firebase/performance');



Object.keys(performance).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return performance[k]; }
	});
});
//# sourceMappingURL=index.cjs.js.map
