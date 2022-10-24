/*global Config: true*/
Config =
(function () {
"use strict";

function Config (database) {
	this.database = database;
	this.changeHandlers = {};
}

Config.defaultValues = {
	skin: 'sepia',
	size: 16,
	footnote: 'some',
	woc: false,
	edits: false,
	grammer: false,
	css: '',
	resume: true,
	'resume-possible': false,
	preview: true
};

Config.rootClassKeys = [
	'skin',
	'size',
	'footnote',
	'woc',
	'edits',
	'grammer'
];

Config.prototype.init = function () {
	return this.database.loadItem('config').then(function (data) {
		this.data = data;
		this.updateRootClass();
	}.bind(this));
};

Config.prototype.get = function (key) {
	return key in this.data ? this.data[key] : Config.defaultValues[key];
};

Config.prototype.set = function (key, val) {
	this.data[key] = val;
	if (this.changeHandlers[key]) {
		this.changeHandlers[key](val);
	}
	this.updateRootClass();
	return this.database.storeItem('config', this.data);
};

Config.prototype.updateRootClass = function () {
	document.documentElement.className = Config.rootClassKeys.map(function (key) {
		return key + '-' + this.get(key);
	}.bind(this)).join(' ');
};

Config.prototype.onChange = function (key, callback) {
	callback(this.get(key));
	this.changeHandlers[key] = callback;
};

return Config;
})();