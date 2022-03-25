/*global Bookmarks: true*/
Bookmarks =
(function () {
"use strict";

function Bookmarks (database) {
	this.database = database;
}

Bookmarks.prototype.init = function () {
	return this.database.loadItem('bookmarks').then(function (data) {
		this.data = data;
	}.bind(this));
};

Bookmarks.prototype.get = function (id) {
	return this.data[id];
};

Bookmarks.prototype.remove = function (id) {
	delete this.data[id];
	return this.database.storeItem('bookmarks', this.data);
};

Bookmarks.prototype.set = function (id, text, color) {
	this.data[id] = {text: text, color: color};
	return this.database.storeItem('bookmarks', this.data);
};

Bookmarks.prototype.getList = function (book, collection) {
	var keys = Object.keys(this.data),
		bookId = book ? book.getId() : '',
		collectionIds = collection.getBooks().map(function (book) {
			return book.id;
		}),
		bmBook = [], bmOther = [];

	function compare (a, b) {
		var i;
		a = a.split('-');
		b = b.split('-');
		if (a[0] !== b[0]) {
			return collectionIds.indexOf(a[0]) - collectionIds.indexOf(b[0]);
		}
		i = 1;
		while (true) {
			if (a[i] === undefined && b[i] === undefined) {
				return 0;
			}
			if (a[i] === undefined) {
				return -1;
			}
			if (b[i] === undefined) {
				return 1;
			}
			if (a[i] !== b[i]) {
				if (isNaN(a[i]) || isNaN(b[i])) {
					return a[i] < b[i] ? -1 : 1;
				}
				return a[i] - b[i];
			}
			i++;
		}
	}

	keys.forEach(function (id) {
		var book = id.slice(0, id.indexOf('-'));
		if (book === bookId) {
			bmBook.push(id);
		} else if (collectionIds.indexOf(book) > -1) {
			bmOther.push(id);
		}
	});
	bmBook.sort(compare);
	bmOther.sort(compare);
	return bmBook.concat(bmOther);
};

return Bookmarks;
})();