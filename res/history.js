/*global History: true*/
/*global util*/
History =
(function () {
"use strict";

function History (database) {
	this.database = database;
}

History.MAX = 15;

History.prototype.init = function () {
	return this.database.loadItem('history').then(function (data) {
		this.data = data;
	}.bind(this));
};

History.prototype.add = function (collection, book, section) {
	var entry = [
		collection.getId(),
		book.getId(),
		section,
		util.htmlEscape(book.getAbbr(section)) + ' <small>(' + util.htmlEscape(collection.getAbbr()) + ')</small>'
	].join('-'), index = this.data.indexOf(entry);
	if (index !== -1) {
		this.data.splice(index, 1);
	}
	this.data.unshift(entry);
	while (this.data.length > History.MAX) {
		this.data.pop();
	}
	return this.database.storeItem('history', this.data);
};

History.prototype.getList = function () {
	return this.data.map(function (entry) {
		var collection, book, section, label;
		entry = entry.split('-');
		collection = entry.shift();
		book = entry.shift();
		section = entry.shift();
		label = entry.join('-');
		return [collection, book, section, label];
	});
};

return History;
})();