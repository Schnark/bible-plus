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
	function getSnippet (text, start, end) {
		return util.htmlEscape(start > 20 ? '…' + text.slice(start - 20, start) : text.slice(0, start)) +
			'<mark>' + util.htmlEscape(text.slice(start, end)) + '</mark>' +
			util.htmlEscape(end + 20 < text.length ? text.slice(end, end + 20) + '…' : text.slice(end));
	}

	return Promise.resolve(
		this.sections.map(function (section, index) {
			var text, pos, len, re, id;
			text = options.content === 'code' ? section.innerHTML : section.textContent;
			if (options.content === 'text-fn') {
				text += '\n' + Array.prototype.map.call(section.querySelectorAll('.fn'), function (fn) {
					return fn.dataset.content;
				}).join('\n');
			}
			if (options.regexp) {
				re = new RegExp(options.search, options.ignoreCase ? 'i' : '');
				pos = text.search(re);
				if (pos > -1) {
					len = re.exec(text)[0].length;
				}
			} else {
				if (options.ignoreCase) {
					pos = text.toLowerCase().indexOf(options.search.toLowerCase());
				} else {
					pos = text.indexOf(options.search);
				}
				len = options.search.length;
			}
			//TODO id
			//TODO multiple results per section
			//TODO limit number of results
			if (pos > -1) {
				return {
					section: index,
					id: id,
					abbr: util.htmlEscape(this.getAbbr(index, id)),
					snippet: (options.content === 'code' ? '<code>' : '') +
						getSnippet(text, pos, pos + len) +
						(options.content === 'code' ? '</code>' : '')
				};
			}
		}.bind(this)).filter(function (data) {
			return data;
		})
	);
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