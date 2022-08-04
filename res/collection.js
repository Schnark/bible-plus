/*global Collection: true*/
/*global Book, util*/
/*global Promise*/
Collection =
(function () {
"use strict";

function Collection (data, database) {
	this.data = data;
	this.database = database;
}

Collection.prototype.getId = function () {
	return this.data.id;
};

Collection.prototype.getType = function () {
	return this.data.type;
};

Collection.prototype.getLang = function () {
	return this.data.lang;
};

Collection.prototype.getTitle = function () {
	return this.data.title;
};

Collection.prototype.getAbbr = function () {
	return this.data.abbr;
};

Collection.prototype.getSort = function () {
	return this.data.sort;
};

Collection.prototype.getDesc = function () {
	return this.data.desc;
};

Collection.prototype.getBooks = function (includeGroups) {
	return includeGroups ? this.data.books : this.data.books.filter(function (book) {
		return book.id;
	});
};

Collection.prototype.hasBook = function (id) {
	return this.data.books.some(function (book) {
		return book.id === id;
	});
};

Collection.prototype.search = function (options) {
	var count = 0, hasMore = false;
	return util.asyncMap(this.getBooks(), function (data) {
		if (options.collectionLimit && count >= options.collectionLimit) {
			if (!hasMore) {
				hasMore = true;
				return [{more: true, range: 'collection'}];
			}
			return [];
		}
		return this.loadBook(data.id).then(function (book) {
			return book.search(options).then(function (results) {
				results = results.map(function (result) {
					result.book = data.id;
					return result;
				});
				count += results.length;
				return results;
			});
		});
	}.bind(this)).then(function (result) {
		return [].concat.apply([], result);
	});
};

Collection.prototype.loadBook = function (id) {
	return this.database.loadItem(this.getId() + '-' + id).then(function (bookContent) {
		return new Book(bookContent);
	});
};

Collection.prototype.export = function () {
	return Promise.all(this.getBooks(true).map(function (book) {
		if (book.id) {
			return this.database.loadItem(this.getId() + '-' + book.id);
		}
		if (book.label) {
			return util.openTag('div', {title: book.label});
		}
		return '</div>';
	}.bind(this))).then(function (html) {
		html.unshift(
			'<!DOCTYPE html>',
			util.openTag('html', {lang: this.getLang()}),
			'<head>',
			'<meta charset="utf-8">',
			'<title>' + util.htmlEscape(this.getTitle()) + '</title>',
			'</head>',
			util.openTag('body', {
				'data-type': this.getType(),
				'data-abbr': this.getAbbr(),
				'data-sort': this.getSort(),
				'data-desc': this.getDesc()
			})
		);
		html.push(
			'</body>',
			'</html>'
		);

		return html.join('\n');
	}.bind(this));
};

return Collection;
})();