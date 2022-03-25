/*global App: true*/
/*global Database, Config, Bookmarks, History, Presenter, Library*/
/*global Promise*/
App =
(function () {
"use strict";

function App (config) {
	this.defaultCollections = config.defaultCollections;
	this.database = new Database(config.dbname);
	this.config = new Config(this.database);
	this.bookmarks = new Bookmarks(this.database);
	this.history = new History(this.database);
	this.presenter = new Presenter();
}

App.prototype.loadLibrary = function () {
	return this.database.loadItem('library').then(function (list) {
		var library = new Library(list, this.database);
		if (Object.keys(list).length > 0) {
			return library;
		}
		return this.importDefault(library).then(function () {
			return library;
		});
	}.bind(this));
};

App.prototype.importDefault = function (library) {
	return Promise.all(this.defaultCollections.map(function (name) {
		return library.importCollection(name);
	}));
};

App.prototype.init = function () {
	this.database.init().then(function () {
		this.presenter.init(this.loadLibrary(), this.config, this.bookmarks, this.history);
	}.bind(this));
};

return App;
})();