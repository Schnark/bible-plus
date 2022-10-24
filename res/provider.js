/*global Provider: true*/
/*global util*/
Provider =
(function () {
"use strict";

function Provider (book, bookmarks, onSectionUpdate) {
	this.book = book;
	this.bookmarks = bookmarks;
	this.onSectionUpdate = onSectionUpdate;
	this.highlightOptions = false;
}

Provider.prototype.setHighlightOptions = function (highlightOptions) {
	this.highlightOptions = highlightOptions;
};

Provider.prototype.getSectionCount = function () {
	return this.book.getSections().length;
};

Provider.prototype.manageInlineFns = function (section) {
	var fns = section.querySelectorAll('.fn.inline'), i;
	for (i = 0; i < fns.length; i++) {
		fns[i].innerHTML = fns[i].dataset.content;
	}
	return section;
};

Provider.prototype.manageBookmarks = function (section) {
	var ids = section.querySelectorAll('[id]'), cont, i, j, el, hasIdEl, mark;
	for (i = 0; i < ids.length; i++) {
		el = ids[i].getElementsByClassName('id')[0];
		cont = section.querySelectorAll('[data-idcont="' + ids[i].id + '"]');
		hasIdEl = !!el;
		if (!hasIdEl) {
			if (cont.length) {
				el = cont[cont.length - 1];
			} else {
				el = ids[i];
			}
		}
		mark = this.bookmarks.get(ids[i].id);
		if (mark) {
			if (mark.color) {
				ids[i].classList.add('highlight-' + mark.color);
				for (j = 0; j < cont.length; j++) {
					cont[j].classList.add('highlight-' + mark.color);
				}
			}
			el.innerHTML += '<span class="bookmark" data-id="' + ids[i].id +
				'" data-content="' + util.htmlEscape(mark.text) + '">&nbsp;★&nbsp;</span>';
		} else if (el.innerHTML) { //ignore empty verses without bookmark
			if (!hasIdEl) {
				el.innerHTML += '<span class="bookmark-add">&nbsp;✩&nbsp;</span>';
			} else {
				el.classList.add('bookmark-add');
			}
		}
	}
	return section;
};

Provider.prototype.getSection = function (index) {
	var section = this.book.getSection(index), links, i;
	section = this.manageInlineFns(section);
	if (this.highlightOptions) {
		section = util.search.highlight(this.highlightOptions, section);
	}
	section = this.manageBookmarks(section);
	links = section.querySelectorAll('.fn:not(.inline), .bookmark, .bookmark-add');
	for (i = 0; i < links.length; i++) {
		links[i].tabIndex = 0;
	}
	return section;
};

Provider.prototype.setSection = function (section) {
	this.onSectionUpdate(section);
};

return Provider;
})();