/*global Book: true*/
/*global util*/
/*global Promise*/
Book =
(function () {
"use strict";

function Book (html) {
	this.doc = (new DOMParser()).parseFromString(html, 'text/html');
	this.base = this.doc.getElementsByTagName('article')[0];
	this.sections = [].slice.call(this.doc.getElementsByTagName('section'));
}

Book.prototype.getTitle = function () {
	return this.base.title;
};

Book.prototype.getLang = function () {
	return this.base.lang;
};

Book.prototype.getId = function () {
	return this.base.id;
};

Book.prototype.getDesc = function () {
	return this.base.dataset.desc;
};

Book.prototype.getAbbr = function (section, verse) {
	var verseEl, verseStr;
	if (section === undefined) {
		return this.base.dataset.abbr;
	}
	if (!verse) {
		return (this.base.dataset.abbrSection || (this.base.dataset.abbr + ' %s'))
			.replace('%s', this.sections[section].dataset.abbr);
	}
	verseEl = this.doc.getElementById(verse);
	if (verseEl && verseEl.dataset.abbr) {
		verseStr = verseEl.dataset.abbr;
	} else if (verseEl) {
		verseEl = verseEl.getElementsByClassName('id');
		if (verseEl && verseEl[0]) {
			verseStr = verseEl[0].textContent.trim().replace(/\.$/, '').trim();
		}
	}
	if (!verseStr) {
		return this.getAbbr(section);
	}
	return (this.base.dataset.abbrVerse || (this.base.dataset.abbr + ' %v'))
		.replace('%s', this.sections[section].dataset.abbr)
		.replace('%v', verseStr);
};

Book.prototype.getSections = function () {
	return this.sections.map(function (section) {
		return {abbr: section.dataset.abbr, cls: section.className};
	});
};

Book.prototype.hasId = function (id) {
	return !!this.doc.getElementById(id);
};

Book.prototype.getSectionIndexForId = function (id) {
	var el = this.doc.getElementById(id);
	el = util.getParent(el, 'SECTION');
	return this.sections.indexOf(el);
};

Book.prototype.getReference = function (verses) {
	function removeNodes (nodes) {
		Array.prototype.slice.call(nodes).forEach(function (node) {
			node.parentNode.removeChild(node);
		});
	}

	return Array.prototype.map.call(this.doc.querySelectorAll(verses.map(function (id) {
		return '#' + id + ',[data-idcont="' + id + '"]';
	}).join(',')), function (verse) {
		verse = verse.cloneNode(true);
		verse.removeAttribute('id');
		verse.removeAttribute('data-idcont');
		removeNodes(verse.querySelectorAll('.fn, .fn-ref, .id-big' + (verses.length === 1 ? ', .id' : '')));
		return verse.outerHTML;
	}).join('\n');
};

Book.prototype.search = function (options) {
	var count = 0, hasMore = false;
	return Promise.resolve(
		this.sections.map(function (section, index) {
			var results;
			if (options.bookLimit && count >= options.bookLimit) {
				if (!hasMore) {
					hasMore = true;
					return [{more: true, range: 'book', abbr: util.htmlEscape(this.getAbbr())}];
				}
				return [];
			}
			results = util.search.searchSection(options, section).map(function (result) {
				result.section = index;
				result.abbr = util.htmlEscape(this.getAbbr(index, result.id));
				return result;
			}.bind(this));
			count += results.length;
			return results;
		}.bind(this))
	).then(function (result) {
		return [].concat.apply([], result);
	});
};

Book.prototype.getSection = function (index) {
	return this.sections[index].cloneNode(true);
};

Book.prototype.translateSectionIndex = function (oldBook, index) {
	var ids = oldBook.getSection(index).querySelectorAll('[id]'), i, id;
	for (i = 0; i < ids.length; i++) {
		id = ids[i].id;
		if (this.hasId(id)) {
			return this.getSectionIndexForId(id);
		}
	}
	return 0;
};

return Book;
})();