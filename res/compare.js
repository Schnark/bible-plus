/*global CompareCollection: true*/
/*global Collection, util*/
CompareCollection =
(function () {
"use strict";

function CompareCollection (c1, c2) {
	this.c1 = c1;
	this.c2 = c2;
}

CompareCollection.prototype.getId = function () {
	return this.c1.getId() + '/' + this.c2.getId();
};

CompareCollection.prototype.getType = function () {
	return this.c1.getType();
};

CompareCollection.prototype.getLang = function () {
	return this.c1.getLang();
};

CompareCollection.prototype.getTitle = function () {
	return this.c1.getTitle() + ' ↔ ' + this.c2.getTitle();
};

CompareCollection.prototype.getAbbr = function () {
	return this.c1.getAbbr() + '↔' + this.c2.getAbbr();
};

CompareCollection.prototype.getDesc = function () {
	return '';
};

CompareCollection.prototype.getBooks = function (includeGroups) {
	return this.c1.getBooks(includeGroups).filter(function (book) { //TODO remove empty groups
		return !book.id || this.c2.hasBook(book.id);
	}.bind(this));
};

CompareCollection.prototype.hasBook = function (id) {
	return this.c1.hasBook(id) && this.c2.hasBook(id);
};

CompareCollection.prototype.search = Collection.prototype.search;

CompareCollection.prototype.loadBook = function (id) {
	return this.c1.loadBook(id).then(function (book1) {
		return this.c2.loadBook(id).then(function (book2) {
			return new CompareBook(book1, book2);
		});
	}.bind(this));
};

function CompareBook (b1, b2) {
	this.b1 = b1;
	this.b2 = b2;
}

CompareBook.prototype.getTitle = function () {
	return this.b1.getTitle();
};

CompareBook.prototype.getLang = function () {
	return this.b1.getLang();
};

CompareBook.prototype.getId = function () {
	return this.b1.getId();
};

CompareBook.prototype.getDesc = function () {
	var d1 = this.b1.getDesc(), d2 = this.b2.getDesc();
	if (!d1 && !d2) {
		return '';
	}
	d1 = '<td>' + d1 + '</td>';
	if (d2 && this.b1.getLang() !== this.b2.getLang()) {
		d2 = util.openTag('td', {lang: this.b2.getLang()}) + d2 + '</td>';
	} else {
		d2 = '<td>' + d2 + '</td>';
	}
	return '<table class="compare"><tbody><tr>' + d1 + d2 + '</tr></tbody></table>';
};

CompareBook.prototype.getAbbr = function (section, verse) {
	return this.b1.getAbbr(section, verse);
};

CompareBook.prototype.getSections = function () {
	return this.b1.getSections();
};

CompareBook.prototype.hasId = function (id) {
	return this.b1.hasId(id); /* TODO  || this.b2.hasId(id) */
};

CompareBook.prototype.getSectionIndexForId = function (id) {
	return this.b1.getSectionIndexForId(id);
};

CompareBook.prototype.getReference = function (verses) {
	return this.b1.getReference(verses); //TODO + b2.getReference()?
};

CompareBook.prototype.search = function (options) {
	return this.b1.search(options); //TODO merge this.b2.search
};

CompareBook.prototype.getSection = function (index) {
	var cachedSections = {}, rightLang, b2 = this.b2,
		table = document.createElement('table'),
		tbody = document.createElement('tbody');

	function splitSection (section) {
		var pre = [], result = [];

		function splitNodeToResult (node) {
			var ids, data;
			ids = node.querySelectorAll ? Array.prototype.map.call(node.querySelectorAll('[id]'), function (el) {
				return el.id;
			}) : [];
			if (node.id) {
				ids.unshift(node.id);
			}
			if (ids.length) {
				data = {
					pre: pre,
					el: node,
					ids: ids
				};
				pre = [];
				result.push(data);
			} else {
				if (node.nodeName === '#text' && !node.textContent.trim()) {
					return;
				}
				pre.push(node);
			}
		}

		function shouldRecurse (node) {
			if (node.id) {
				return false;
			}
			if (!node.childNodes) {
				return false;
			}
			if (node.tagName === 'SECTION' || node.tagName === 'DIV') {
				return true;
			}
			if (node.tagName !== 'P') {
				return false;
			}
			if (node.querySelectorAll('[id]').length) {
				return true;
			}
			return false;
		}

		function recursiveSplitNodeToResult (node) {
			if (shouldRecurse(node)) {
				Array.prototype.forEach.call(node.childNodes, recursiveSplitNodeToResult);
			} else {
				splitNodeToResult(node);
			}
		}

		recursiveSplitNodeToResult(section);
		if (pre.length) { //last elements without id
			result.push({
				pre: pre,
				el: false,
				ids: ['']
			});
		}
		return result;
	}

	function getRightSection (section) {
		if (!cachedSections[section]) {
			cachedSections[section] = splitSection(b2.getSection(section));
		}
		return cachedSections[section];
	}

	function getRightChunk (id) {
		var section, i;
		if (!b2.hasId(id)) {
			return {
				pre: []
			};
		}
		section = getRightSection(b2.getSectionIndexForId(id));
		for (i = 0; i < section.length; i++) {
			if (section[i].ids.indexOf(id) > -1) {
				section[i].ids = [];
				return {
					pre: section[i].pre,
					el: section[i].el
				};
			}
		}
		return {
			pre: []
		};
	}

	function mergeChunk (left) {
		var rightPre, rightEl = [];
		left.ids.forEach(function (id, i) {
			var chunk = getRightChunk(id);
			if (i === 0) {
				rightPre = chunk.pre;
			}
			if (chunk.el) {
				rightEl.push(chunk.el);
			}
		});
		return {
			leftPre: left.pre,
			rightPre: rightPre,
			leftEl: left.el ? [left.el] : [],
			rightEl: rightEl
		};
	}

	function buildRow (left, right) {
		var tr = document.createElement('tr'),
			td1 = document.createElement('td'),
			td2 = document.createElement('td'),
			i;
		for (i = 0; i < left.length; i++) {
			td1.appendChild(left[i]);
		}
		for (i = 0; i < right.length; i++) {
			td2.appendChild(right[i]);
		}
		if (rightLang) {
			td2.lang = rightLang;
		}
		Array.prototype.forEach.call(td2.querySelectorAll('[id]'), function (el) {
			el.dataset.idcont = el.id;
			el.removeAttribute('id');
		});
		tr.appendChild(td1);
		tr.appendChild(td2);
		return tr;
	}

	function formatRow (data) {
		var rows = [];
		if (data.leftPre.length || data.rightPre.length) {
			rows.push(buildRow(data.leftPre, data.rightPre));
		}
		if (data.leftEl.length || data.rightEl.length) {
			rows.push(buildRow(data.leftEl, data.rightEl));
		}
		return rows;
	}

	if (this.b1.getLang() !== this.b2.getLang()) {
		rightLang = this.b2.getLang();
	}
	splitSection(this.b1.getSection(index)).map(mergeChunk).map(formatRow).forEach(function (rows) {
		var i;
		for (i = 0; i < rows.length; i++) {
			tbody.appendChild(rows[i]);
		}
	});
	table.appendChild(tbody);
	table.className = 'compare';
	return table;
};

CompareBook.prototype.translateSectionIndex = function (oldBook, index) {
	return this.b1.translateSectionIndex(oldBook, index);
};

return CompareCollection;
})();