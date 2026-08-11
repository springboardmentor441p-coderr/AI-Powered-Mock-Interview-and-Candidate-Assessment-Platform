'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var dataConnect = require('@firebase/data-connect');



Object.keys(dataConnect).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return dataConnect[k]; }
	});
});
//# sourceMappingURL=index.cjs.js.map
