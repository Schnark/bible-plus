/*global Library: true*/
/*global Collection, CompareCollection, util*/
/*global Promise*/
Library =
(function () {
"use strict";

function Library (data, database) {
	this.data = data;
	this.database = database;
}

Library.prototype.getCollections = function (book) {
	var list = Object.keys(this.data);
	if (book) {
		list = list.filter(function (id) {
			return this.data[id].books.indexOf(book) > -1;
		}.bind(this));
	}
	list = list.map(function (id) {
		return {
			id: id,
			title: this.data[id].title,
			type: this.data[id].type,
			sort: this.data[id].sort,
			lang: this.data[id].lang
		};
	}.bind(this));
	list.sort(function (a, b) {
		if (a.type !== b.type) {
			return a.type < b.type ? -1 : 1;
		}
		if (a.lang !== b.lang) {
			return a.lang < b.lang ? -1 : 1;
		}
		if (a.sort !== b.sort) {
			return a.sort < b.sort ? -1 : 1;
		}
		if (a.title !== b.title) {
			return a.title < b.title ? -1 : 1;
		}
		return a.id < b.id ? -1 : 1;
	});
	return list;
};

Library.prototype.loadCollection = function (id) {
	var pos = id.indexOf('/');
	if (pos === -1) {
		return this.database.loadItem(id).then(function (data) {
			return new Collection(data, this.database);
		}.bind(this));
	}
	return this.loadCollection(id.slice(0, pos)).then(function (c1) {
		return this.loadCollection(id.slice(pos + 1)).then(function (c2) {
			return new CompareCollection(c1, c2);
		});
	}.bind(this));
};

Library.prototype.search = function (options) {
	var count = 0, hasMore = false;
	return util.asyncMap(this.getCollections(), function (data) {
		if (options.libraryLimit && count >= options.libraryLimit) {
			if (!hasMore) {
				hasMore = true;
				return [{more: true, range: 'library'}];
			}
			return [];
		}
		return this.loadCollection(data.id).then(function (collection) {
			return collection.search(options).then(function (results) {
				results = results.map(function (result) {
					result.collection = data.id;
					if (result.abbr) {
						result.abbr += ' <small>(' + util.htmlEscape(collection.getAbbr()) + ')</small>';
					} else {
						result.abbr = util.htmlEscape(collection.getAbbr());
					}
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

Library.prototype.importCollection = function (urlOrFile, updateId) {
	function getId (existingIds) {
		var id = 'c' + String(Math.floor(10 * Math.random()));
		while (id in existingIds) {
			id += String(Math.floor(10 * Math.random()));
		}
		return id;
	}

	var parsePromise;

	if (!urlOrFile) {
		parsePromise = util.parseFile();
	} else if (typeof urlOrFile === 'string') {
		parsePromise = util.parseUrl(urlOrFile);
	} else {
		parsePromise = util.parseFile(urlOrFile);
	}

	return parsePromise.then(function (collectionData) {
		var id, deletePromise;
		if (updateId) {
			deletePromise = this.removeCollection(updateId);
			id = updateId;
		} else {
			deletePromise = Promise.resolve();
		}
		return Promise.all([
			deletePromise,
			this.database.loadItem('library')
		]).then(function (data) {
			var libraryData = data[1], map = {};
			if (!id) {
				id = getId(libraryData); //create id
			}
			collectionData.data.id = id; //store it in the metadata
			libraryData[id] = { //add to library
				title: collectionData.data.title,
				type: collectionData.data.type,
				sort: collectionData.data.sort,
				lang: collectionData.data.lang,
				books: collectionData.data.books.map(function (book) {
					return book.id;
				}).filter(function (id) {
					return id;
				})
			};
			map.library = libraryData; //request storing the changed library data
			map[id] = collectionData.data; //request storing the new collection meta data ...
			Object.keys(collectionData.books).forEach(function (book) { //... and all its books
				map[id + '-' + book] = collectionData.books[book];
			});
			return this.database.storeItems(map).then(function () {
				this.data = libraryData;
				return id;
			}.bind(this));
		}.bind(this));
	}.bind(this));
};

Library.prototype.removeCollection = function (id) {
	return this.database.loadItem('library').then(function (data) {
		var ids = data[id].books.map(function (book) { //all books in the collection ...
			return id + '-' + book;
		});
		ids.push(id); //... and the collection itself
		delete data[id];
		return this.database.storeItem('library', data).then(function () {
			this.data = data;
			return this.database.removeItems(ids);
		}.bind(this));
	}.bind(this));
};

Library.prototype.exportCollection = function (id) {
	return this.loadCollection(id).then(function (collection) {
		return collection.export();
	});
};

return Library;
})();