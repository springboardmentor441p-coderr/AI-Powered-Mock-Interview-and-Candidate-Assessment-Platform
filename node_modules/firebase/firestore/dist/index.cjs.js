'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var firestore = require('@firebase/firestore');



Object.keys(firestore).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return firestore[k]; }
	});
});
//# sourceMappingURL=index.cjs.js.map
