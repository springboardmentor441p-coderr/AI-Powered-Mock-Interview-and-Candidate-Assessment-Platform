'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pipelines = require('@firebase/firestore/lite/pipelines');



Object.keys(pipelines).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return pipelines[k]; }
	});
});
//# sourceMappingURL=pipelines.cjs.js.map
