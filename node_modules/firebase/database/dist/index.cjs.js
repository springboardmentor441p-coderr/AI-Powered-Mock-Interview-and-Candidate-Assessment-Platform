'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var database = require('@firebase/database');



Object.keys(database).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return database[k]; }
	});
});
//# sourceMappingURL=index.cjs.js.map
