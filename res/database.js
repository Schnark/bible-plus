/*global Database: true*/
/*global Promise*/
Database =
(function () {
"use strict";

function AbstractDatabase () {
}

AbstractDatabase.prototype.init = function () {
	return this.loadItem('library').then(null, function () {
		return this.storeItems(this.getEmpty());
	}.bind(this));
};

AbstractDatabase.prototype.getEmpty = function () {
	return {
		'library': {},
		'config': {},
		'bookmarks': {},
		'history': []
	};
};

AbstractDatabase.prototype.storeItems = function (map) {
	return Promise.all(Object.keys(map).map(function (key) {
		return this.storeItem(key, map[key]);
	}.bind(this)));
};

AbstractDatabase.prototype.removeItems = function (ids) {
	return Promise.all(ids.map(function (id) {
		return this.removeItem(id);
	}.bind(this)));
};

function DebugDatabase () {
	this.data = {};
}

DebugDatabase.prototype = new AbstractDatabase();

DebugDatabase.prototype.storeItem = function (id, data) {
	this.data[id] = data;
	return Promise.resolve();
};

DebugDatabase.prototype.removeItem = function (id) {
	if (!(id in this.data)) {
		return Promise.reject('"' + id + '" is missing in database, can’t delete');
	}
	delete this.data[id];
	return Promise.resolve();
};

DebugDatabase.prototype.loadItem = function (id) {
	/*return new Promise(function (resolve, reject) {
		setTimeout(function () {
			if (id in this.data) {
				resolve(this.data[id]);
			} else {
				reject('"' + id + '" is missing in database');
			}
		}.bind(this), 1000);
	}.bind(this));*/
	return id in this.data ? Promise.resolve(this.data[id]) : Promise.reject('"' + id + '" is missing in database');
};

function IDBDatabase (name) {
	var indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.indexedDB;
	if (!indexedDB) {
		return new DebugDatabase();
	}
	this.db = new Promise(function (resolve, reject) {
		var req = indexedDB.open(name, 1);
		req.onerror = function () {
			reject(req.error);
		};
		req.onupgradeneeded = function () {
			req.result.createObjectStore('keyvaluepairs');
		};
		req.onsuccess = function () {
			resolve(req.result);
		};
	});
}

IDBDatabase.prototype = new AbstractDatabase();

IDBDatabase.prototype.getStore = function (mode) {
	return this.db.then(function (db) {
		return db.transaction('keyvaluepairs', mode).objectStore('keyvaluepairs');
	});
};

IDBDatabase.prototype.storeItem = function (id, data) {
	return this.getStore('readwrite').then(function (store) {
		return new Promise(function (resolve, reject) {
			var req = store.put(data, id);
			req.onerror = function () {
				reject(req.error);
			};
			req.onsuccess = function () {
				resolve();
			};
		});
	});
};

IDBDatabase.prototype.removeItem = function (id) {
	return this.getStore('readwrite').then(function (store) {
		return new Promise(function (resolve, reject) {
			var req = store.delete(id);
			req.onerror = function () {
				reject(req.error);
			};
			req.onsuccess = function () {
				resolve();
			};
		});
	});
};

IDBDatabase.prototype.loadItem = function (id) {
	return this.getStore('readonly').then(function (store) {
		return new Promise(function (resolve, reject) {
			var req = store.get(id);
			req.onerror = function () {
				reject(req.error);
			};
			req.onsuccess = function () {
				if (!req.result) {
					reject('"' + id + '" is missing in database');
				} else {
					resolve(req.result);
				}
			};
		});
	});
};

function Database (name) {
	return name ? new IDBDatabase(name) : new DebugDatabase();
}

return Database;
})();