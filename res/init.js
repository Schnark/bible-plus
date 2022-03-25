/*global App*/
(function () {
"use strict";

var options, app, debug;

debug = false;

if (debug) {
	options = {
		defaultCollections: [
			'collections/help.html',
			'collections/test-de.html',
			'collections/test-en.html'
		]
	};
} else {
	options = {
		dbname: 'bible-plus-db',
		defaultCollections: ['collections/help.html']
	};
}

app = new App(options);
app.init();

})();