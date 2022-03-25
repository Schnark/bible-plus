/*global Presenter: true*/
/*global Page, Scroller, Provider, util*/
/*global Promise, alert, confirm*/
Presenter =
(function () {
"use strict";

function Presenter () {
	//TODO add keyboard events to make things more accessible
	this.configPage = new Page(
		document.getElementById('config-page'),
		{
			body: this.onConfigBodyClick.bind(this),
			close: this.onConfigCloseClick.bind(this)
		}
	);
	this.searchPage = new Page(
		document.getElementById('search-page'),
		{
			body: this.onSearchBodyClick.bind(this),
			close: this.onSearchCloseClick.bind(this)
		},
		{
			submit: this.onSearchSubmit.bind(this)
		}
	);
	this.libraryTocPage = new Page(
		document.getElementById('library-toc-page'),
		{
			body: this.onLibraryTocBodyClick.bind(this),
			search: this.onLibraryTocSearchClick.bind(this),
			config: this.onLibraryTocConfigClick.bind(this)
		}
	);
	this.collectionSwitchPage = new Page(
		document.getElementById('collection-switch-page'),
		{
			body: this.onCollectionSwitchBodyClick.bind(this),
			close: this.onCollectionSwitchCloseClick.bind(this),
			up: this.onCollectionSwitchUpClick.bind(this)
		}
	);
	this.collectionTocPage = new Page(
		document.getElementById('collection-toc-page'),
		{
			body: this.onCollectionTocBodyClick.bind(this),
			search: this.onCollectionTocSearchClick.bind(this),
			bookmarklist: this.onCollectionTocBookmarklistClick.bind(this),
			up: this.onCollectionTocUpClick.bind(this)
		}
	);
	this.bookTocPage = new Page(
		document.getElementById('book-toc-page'),
		{
			body: this.onBookTocBodyClick.bind(this),
			close: this.onBookTocCloseClick.bind(this),
			up: this.onBookTocUpClick.bind(this)
		}
	);
	this.historyPage = new Page(
		document.getElementById('history-page'),
		{
			body: this.onHistoryBodyClick.bind(this),
			close: this.onHistoryCloseClick.bind(this)
		}
	);
	this.bookmarkPage = new Page(
		document.getElementById('bookmark-page'),
		{
			body: this.onBookmarkBodyClick.bind(this),
			close: this.onBookmarkCloseClick.bind(this)
		}
	);
	this.bookPage = new Page(
		document.getElementById('book-page'),
		{
			body: this.onBookBodyClick.bind(this),
			collection: this.onBookCollectionClick.bind(this),
			toc: this.onBookTocClick.bind(this),
			history: this.onBookHistoryClick.bind(this),
			search: this.onBookSearchClick.bind(this),
			bookmarklist: this.onBookBookmarklistClick.bind(this),
			config: this.onBookConfigClick.bind(this)
		}
	);
	this.bookScroller = new Scroller(document.getElementById('book-page').getElementsByClassName('body')[0]);
	this.progress = document.getElementById('progress');
	this.progress.hidden = true;
	this.footnotePopup = new Page(
		document.getElementById('footnote-popup'),
		{
			body: this.onFootnoteBodyClick.bind(this)
		}
	);
	this.bookmarkPopup = new Page(
		document.getElementById('bookmark-popup'),
		{
			edit: this.onBookmarkEditClick.bind(this)
		}
	);
	this.bookmarkeditPopup = new Page(
		document.getElementById('bookmarkedit-popup'),
		{
			remove: this.onBookmarkRemoveClick.bind(this),
			save: this.onBookmarkSaveClick.bind(this)
		}
	);
}

Presenter.prototype.init = function (libraryPromise, config, bookmarks, history) {
	this.showProgress();
	this.config = config;
	this.bookmarks = bookmarks;
	this.history = history;
	Promise.all([
		libraryPromise,
		this.config.init(),
		this.bookmarks.init(),
		this.history.init()
	]).then(function (libraryAndUndefineds) {
		var histEntry, startsWithActivity;
		this.initConfig();
		this.initDrop();
		this.hideProgress();
		this.setLibrary(libraryAndUndefineds[0]);
		util.file.registerActivityHandler(function (file) {
			if (confirm('Import selected file "' + file.name + '"?')) {
				startsWithActivity = true;
				//we don't know which page is visible, so we just hide all
				this.configPage.hide();
				this.searchPage.hide();
				this.libraryTocPage.hide();
				this.collectionSwitchPage.hide();
				this.collectionTocPage.hide();
				this.bookTocPage.hide();
				this.historyPage.hide();
				this.bookmarkPage.hide();
				this.bookPage.hide();
				//close open popups
				this.closePopups();
				//switch to config page
				this.showConfig();
				this.importFile(file);
			}
		}.bind(this));
		if (startsWithActivity) {
			return;
		}
		histEntry = this.history.getList()[0];
		if (this.config.get('resume') && this.config.get('resume-possible') && histEntry) {
			this.showSpecificBook(histEntry[0], histEntry[1], histEntry[2]);
		} else {
			this.showLibraryToc();
		}
	}.bind(this), function (e) {
		this.hideProgress();
		this.showError('Error loading library, config, bookmarks, and history: ' + e);
	}.bind(this));
};

Presenter.prototype.initConfig = function () {
	var config = this.config, inputs = document.querySelectorAll('[data-config]'), i;
	function onCheckboxChange () {
		/*jshint validthis: true*/
		config.set(this.dataset.config, this.checked);
	}
	function onInputChange () {
		/*jshint validthis: true*/
		config.set(this.dataset.config, this.value);
	}
	for (i = 0; i < inputs.length; i++) {
		if (inputs[i].type === 'checkbox') {
			inputs[i].checked = config.get(inputs[i].dataset.config);
			inputs[i].addEventListener('change', onCheckboxChange);
		} else {
			inputs[i].value = config.get(inputs[i].dataset.config);
			inputs[i].addEventListener('change', onInputChange);
		}
	}
};

Presenter.prototype.initDrop = function () {
	var drop = document.getElementById('drop-file');
	drop.addEventListener('dragover', function (e) {
		e.preventDefault();
	});
	drop.addEventListener('drop', function (e) {
		var file;
		e.preventDefault();
		file = e.dataTransfer.files[0];
		if (file) {
			this.importFile(file);
		}
	}.bind(this));
};

Presenter.prototype.importFile = function (file, updateId) {
	this.showProgress();
	this.library.importCollection(file, updateId).then(function (id) {
		this.library.loadCollection(id).then(function (collection) {
			this.hideProgress();
			this.configPage.hide();
			this.setCollection(collection);
			this.showCollectionToc();
		}.bind(this), function (e) {
			this.hideProgress();
			this.showError('Error loading collection: ' + e);
		}.bind(this));
	}.bind(this), function (e) {
		this.hideProgress();
		this.showError('Error importing collection: ' + e);
	}.bind(this));
};

Presenter.prototype.setLibrary = function (library) {
	this.library = library;
};

Presenter.prototype.setCollection = function (collection) {
	this.collection = collection;
	this.setBook(null);
	if (collection) {
		document.getElementById('book-page').getElementsByClassName('collection')[0].textContent = this.collection.getAbbr();
	}
};

Presenter.prototype.setBook = function (book) {
	this.book = book;
	this.sectionIndex = undefined;
	this.config.set('resume-possible', !!book);
	if (book) {
		this.bookScroller.setProvider(new Provider(book, this.bookmarks, this.onSectionUpdate.bind(this)));
	}
};

Presenter.prototype.setSection = function (section) {
	this.sectionIndex = section;
	document.getElementById('book-page').getElementsByClassName('toc')[0].textContent = this.book.getAbbr(section);
	this.history.add(this.collection, this.book, section);
};

Presenter.prototype.showProgress = function () {
	this.progress.hidden = false;
};

Presenter.prototype.hideProgress = function () {
	this.progress.hidden = true;
};

Presenter.prototype.closePopups = function () {
	if (this.footnotePopup.isVisible()) {
		this.footnotePopup.hide();
		return true;
	}
	if (this.bookmarkPopup.isVisible()) {
		this.bookmarkPopup.hide();
		return true;
	}
	if (this.bookmarkeditPopup.isVisible()) {
		this.bookmarkeditPopup.hide();
		return true;
	}
};

Presenter.prototype.doSearch = function (range, options, resultArea) {
	this.showProgress();
	range.search(options).then(function (results) {
		var html = results.map(function (result) {
			return util.openTag('li', {
				'data-collection': result.collection || this.collection.getId(),
				'data-book': result.book || this.book.getId(),
				'data-section': result.section,
				'data-id': result.id
			}) + '<b>' + result.abbr + '</b>: ' + result.snippet + '</li>';
		}.bind(this)).join('');
		if (html) {
			html = '<ul>' + html + '</ul>';
		} else {
			html = '<p>No search results</p>';
		}
		resultArea.innerHTML = html;
		this.hideProgress();
	}.bind(this), function (e) {
		this.hideProgress();
		this.showError('Error while searching: ' + e);
	}.bind(this));
};

Presenter.prototype.onConfigCloseClick = function () {
	this.configPage.hide();
	if (this.sectionIndex !== undefined) {
		this.bookPage.show();
	} else {
		this.showLibraryToc();
	}
};

Presenter.prototype.onConfigBodyClick = function (e) {
	var action = e.target.dataset.action, id = e.target.dataset.id, p;
	switch (action) {
	case 'import-collection':
		this.importFile();
		break;
	case 'update':
		this.importFile(null, id);
		break;
	case 'remove':
		if (confirm('Really delete "' + e.target.dataset.title + '"?')) {
			this.showProgress();
			this.library.removeCollection(id).then(function () {
				p = e.target.parentNode;
				p.parentNode.removeChild(p);
				this.hideProgress();
			}.bind(this), function (e) {
				this.hideProgress();
				this.showError('Error removing collection: ' + e);
			}.bind(this));
		}
		break;
	case 'export':
		this.showProgress();
		this.library.exportCollection(id).then(function (html) {
			util.file.save(html, id + '.html', 'image/png'); //wrong mime is intentional
			this.hideProgress();
		}.bind(this), function (e) {
			this.hideProgress();
			this.showError('Error exporting collection: ' + e);
		}.bind(this));
	}
};

Presenter.prototype.onSearchCloseClick = function () {
	this.searchPage.hide();
	if (this.book && this.sectionIndex !== undefined) {
		this.bookPage.show();
	/*} else if (this.book) {
		this.bookTocPage.show();*/
	} else if (this.collection) {
		this.collectionTocPage.show();
	} else {
		this.libraryTocPage.show();
	}
};

Presenter.prototype.onSearchBodyClick = function (e) {
	var li, data;
	li = util.getParent(e.target, 'LI');
	if (li) {
		data = li.dataset;
	}
	if (data && data.collection) {
		this.searchPage.hide();
		this.showSpecificBook(data.collection, data.book, data.section, data.id);
	}
};

Presenter.prototype.onSearchSubmit = function (e) {
	var range, options = {};
	e.preventDefault();
	switch (this.searchPage.getElement('search-select').value) {
	case 'library':
		range = this.library;
		break;
	case 'collection':
		//unfortunately disabling options does not always work on mobile,
		//so the user might be able to select an invalid range
		range = this.collection || this.library;
		break;
	case 'book':
		range = this.book || this.collection || this.library;
	}
	options.search = this.searchPage.getElement('search-text').value;
	options.content = this.searchPage.getElement('search-content').value;
	options.ignoreCase = this.searchPage.getElement('search-case').checked;
	options.regexp = this.searchPage.getElement('search-regexp').checked;
	this.doSearch(range, options, this.searchPage.getElement('search-results'));
};

Presenter.prototype.onLibraryTocBodyClick = function (e) {
	var id = e.target.dataset.id;
	if (id) {
		this.showProgress();
		this.library.loadCollection(id).then(function (collection) {
			this.hideProgress();
			this.libraryTocPage.hide();
			this.setCollection(collection);
			this.showCollectionToc();
		}.bind(this), function (e) {
			this.hideProgress();
			this.showError('Error loading collection: ' + e);
		}.bind(this));
	}
};

Presenter.prototype.onLibraryTocConfigClick = function () {
	this.libraryTocPage.hide();
	this.showConfig();
};

Presenter.prototype.onLibraryTocSearchClick = function () {
	this.libraryTocPage.hide();
	this.showSearch();
};

Presenter.prototype.onCollectionSwitchBodyClick = function (e) {
	var id = e.target.dataset.id, oldBook, oldSection;
	if (id) {
		if (this.collection.getId() === id) {
			this.collectionSwitchPage.hide();
			this.bookPage.show();
			return;
		}
		oldBook = this.book;
		oldSection = this.sectionIndex;
		this.showProgress();
		this.library.loadCollection(id).then(function (collection) {
			this.setCollection(collection);
			return collection.loadBook(oldBook.getId());
		}.bind(this)).then(function (book) {
			var sectionIndex = book.translateSectionIndex(oldBook, oldSection);
			this.setBook(book);
			this.hideProgress();
			this.collectionSwitchPage.hide();
			this.showBook(sectionIndex);
		}.bind(this), function (e) {
			this.hideProgress();
			this.showError('Error switching collection: ' + e);
		}.bind(this));
	}
};

Presenter.prototype.onCollectionSwitchCloseClick = function () {
	this.collectionSwitchPage.hide();
	this.bookPage.show();
};

Presenter.prototype.onCollectionSwitchUpClick = function () {
	this.collectionSwitchPage.hide();
	this.showLibraryToc();
};

Presenter.prototype.onCollectionTocSearchClick = function () {
	this.collectionTocPage.hide();
	this.showSearch();
};

Presenter.prototype.onCollectionTocBookmarklistClick = function () {
	this.collectionTocPage.hide();
	this.showBookmarkList();
};

Presenter.prototype.onCollectionTocUpClick = function () {
	this.collectionTocPage.hide();
	this.showLibraryToc();
};

Presenter.prototype.onCollectionTocBodyClick = function (e) {
	var id = e.target.dataset.id;
	if (id) {
		this.showProgress();
		this.collection.loadBook(id).then(function (book) {
			this.hideProgress();
			this.collectionTocPage.hide();
			this.setBook(book);
			this.showBookToc();
		}.bind(this), function (e) {
			this.hideProgress();
			this.showError('Error loading book: ' + e);
		}.bind(this));
	}
};

Presenter.prototype.onHistoryCloseClick = function () {
	this.historyPage.hide();
	if (this.book && this.sectionIndex !== undefined) {
		this.bookPage.show();
	/*} else if (this.book) {
		this.bookTocPage.show();*/
	} else {
		this.collectionTocPage.show();
	}
};

Presenter.prototype.onHistoryBodyClick = function (e) {
	var data = e.target.dataset;
	if (data.collection) {
		this.historyPage.hide();
		this.showSpecificBook(data.collection, data.book, data.section);
	}
};

Presenter.prototype.onBookmarkCloseClick = function () {
	this.bookmarkPage.hide();
	if (this.book && this.sectionIndex !== undefined) {
		this.bookPage.show();
	/*} else if (this.book) {
		this.bookTocPage.show();*/
	} else {
		this.collectionTocPage.show();
	}
};

Presenter.prototype.onBookmarkBodyClick = function (e) {
	var id = e.target.dataset.href;
	if (id) {
		this.bookmarkPage.hide();
		this.bookPage.show();
		this.showBookRef(id.slice(0, id.indexOf('-')), id);
	}
};

Presenter.prototype.onBookTocCloseClick = function () {
	this.bookTocPage.hide();
	if (this.book && this.sectionIndex !== undefined) {
		this.bookPage.show();
	} else {
		this.showCollectionToc();
	}
};

Presenter.prototype.onBookTocUpClick = function () {
	this.bookTocPage.hide();
	this.showCollectionToc();
};

Presenter.prototype.onBookTocBodyClick = function (e) {
	var index = e.target.dataset.index;
	if (index) {
		this.bookTocPage.hide();
		this.showBook(Number(index));
	}
};

Presenter.prototype.onBookBodyClick = function (e) {
	var link = util.getParent(e.target, 'A'), hadOpenPopup, ref, idEl;
	hadOpenPopup = this.closePopups();
	if (link) {
		ref = /^#([a-z0-9]+)(?:-(\S+))?$/.exec(link.getAttribute('href'));
		if (ref && ((hadOpenPopup && this.config.get('preview') && link.classList.contains('preview')) || !hadOpenPopup)) {
			this.showBookRef(
				ref[1],
				ref[2] && (ref[1] + '-' + ref[2]),
				link.dataset.ref,
				this.config.get('preview') && link.classList.contains('preview') && link.innerHTML
			);
			e.preventDefault();
		} else if (hadOpenPopup) {
			e.preventDefault();
		}
	} else if (e.target.classList.contains('fn') && !e.target.classList.contains('inline')) {
		this.showFootnote(e.target.dataset.content);
	} else if (e.target.classList.contains('bookmark')) {
		this.showBookmark(e.target.dataset.content, e.target.dataset.id);
	} else if (e.target.classList.contains('bookmark-add')) {
		idEl = util.getParent(
			e.target,
			function (el) {
				return el.id || el.dataset.idcont;
			}
		);
		this.editBookmark(idEl.id || idEl.dataset.idcont);
	}
};

Presenter.prototype.onBookCollectionClick = function () {
	this.closePopups();
	this.bookPage.hide();
	this.showCollectionSwitch();
};

Presenter.prototype.onBookTocClick = function () {
	this.closePopups();
	this.bookPage.hide();
	this.showBookToc();
};

Presenter.prototype.onBookHistoryClick = function () {
	this.closePopups();
	this.bookPage.hide();
	this.showHistoryPage();
};

Presenter.prototype.onBookSearchClick = function () {
	this.closePopups();
	this.bookPage.hide();
	this.showSearch();
};

Presenter.prototype.onBookBookmarklistClick = function () {
	this.closePopups();
	this.bookPage.hide();
	this.showBookmarkList();
};

Presenter.prototype.onBookConfigClick = function () {
	this.closePopups();
	this.bookPage.hide();
	this.showConfig();
};

Presenter.prototype.onFootnoteBodyClick = function (e) {
	var link = util.getParent(e.target, 'A'), ref;
	if (link) {
		ref = /^#([a-z0-9]+)(?:-(\S+))?$/.exec(link.getAttribute('href'));
		if (ref) {
			this.footnotePopup.hide();
			this.showBookRef(
				ref[1],
				ref[2] && (ref[1] + '-' + ref[2]),
				link.dataset.ref,
				this.config.get('preview') && link.classList.contains('preview') && link.innerHTML
			);
			e.preventDefault();
		}
	}
};

Presenter.prototype.onBookmarkEditClick = function () {
	this.bookmarkPopup.hide();
	this.editBookmark(this.bookmarkId);
};

Presenter.prototype.onBookmarkRemoveClick = function () {
	var id = this.bookmarkId;
	this.bookmarkeditPopup.hide();
	this.bookmarks.remove(id);
	this.bookScroller.updateSection(this.book.getSectionIndexForId(id));
};

Presenter.prototype.onBookmarkSaveClick = function () {
	var text = document.getElementById('bookmarkedit-text').value.trim(),
		id = this.bookmarkId;
	if (text) {
		this.bookmarkeditPopup.hide();
		this.bookmarks.set(id, text, Number(document.querySelector('[name="highlight"]:checked').value));
		this.bookScroller.updateSection(this.book.getSectionIndexForId(id));
	}
};

Presenter.prototype.onSectionUpdate = function (section) {
	this.setSection(section);
};

Presenter.prototype.showConfig = function () {
	var removeExportCollection, id = (this.collection && this.collection.getId()) || '';
	removeExportCollection = this.library.getCollections().map(function (collection) {
		var buttons = [];
		if (
			collection.id !== id &&
			(id.indexOf('/') === -1 || id.split('/').indexOf(collection.id) === -1)
		) {
			buttons.push(util.openTag('button', {'data-action': 'update', 'data-id': collection.id}) + 'Update</button>');
			buttons.push(
				util.openTag('button', {'data-action': 'remove', 'data-id': collection.id, 'data-title': collection.title}) +
					'Remove</button>'
			);
		} else {
			buttons.push('<button disabled>Update</button>');
			buttons.push('<button disabled>Remove</button>');
		}
		buttons.push(util.openTag('button', {'data-action': 'export', 'data-id': collection.id}) + 'Export</button>');
		return '<p>' + util.openTag('span', {lang: collection.lang}) + util.htmlEscape(collection.title) +
			'</span><br>' + buttons.join(' ') + '</p>';
	});
	this.configPage.show('', 'Config', '');
	this.configPage.getElement('remove-export-collection').innerHTML = removeExportCollection.join('');
};

Presenter.prototype.showSearch = function () {
	var select = this.searchPage.getElement('search-select');
	if (!this.book && select.value === 'book') {
		select.value = 'collection';
	}
	select.querySelector('[value="book"]').disabled = !this.book;
	if (!this.collection && select.value === 'collection') {
		select.value = 'library';
	}
	select.querySelector('[value="collection"]').disabled = !this.collection;
	this.searchPage.show('', 'Search', '');
};

Presenter.prototype.showLibraryToc = function () {
	var html = [], currentLabel, typeLabels = {
		bible: 'Bible',
		doc: 'Documents',
		help: 'Help',
		test: 'Test'
	};
	this.setCollection(null);
	this.library.getCollections().map(function (collection) {
		return {
			html: '<li>' + util.openTag('button', {'data-id': collection.id, lang: collection.lang}) +
				util.htmlEscape(collection.title) + '</button></li>',
			type: collection.type
		};
	}).forEach(function (collection) {
		var label = typeLabels[collection.type] || '';
		if (label !== currentLabel) {
			if (currentLabel !== undefined) {
				html.push(currentLabel ? '</ul></fieldset>' : '</ul>');
			}
			html.push((label ? '<fieldset><legend>' + label + '</legend>' : '') + '<ul class="button-list">');
			currentLabel = label;
		}
		html.push(collection.html);
	});
	if (currentLabel !== undefined) {
		html.push(currentLabel ? '</ul></fieldset>' : '</ul>');
	}
	html = html.join('');
	this.libraryTocPage.show('', 'Library', html || '<p>Library is empty</p>');
};

Presenter.prototype.showCollectionSwitch = function () {
	var html, id = this.collection.getId(), canCompare;
	html = this.library.getCollections(this.book.getId()).map(function (collection) {
		if (collection.id === id) {
			return '<li>' + util.openTag('button', {lang: collection.lang, disabled: 'disabled'}) +
				util.htmlEscape(collection.title) + '</button></li>';
		}
		canCompare = id.indexOf('/') === -1;
		return '<li>' +
			util.openTag('button', {'class': canCompare ? 'split' : '', 'data-id': collection.id, lang: collection.lang}) +
			util.htmlEscape(collection.title) + '</button>' +
			(canCompare ? util.openTag('button', {'data-id': id + '/' + collection.id}) + '↔</button>' : '') +
			'</li>';
	});
	html = '<ul class="button-list">' + html.join('') + '</ul>';
	this.collectionSwitchPage.show('', 'Switch Collection', html);
};

Presenter.prototype.showCollectionToc = function () {
	var html, books, long, open, desc;
	this.setBook(null);
	books = this.collection.getBooks(true);
	long = books.length > 5;
	open = '<ul class="button-list' + (long ? '-inline' : '') + '">';
	html = books.map(function (book) {
		if (book.id) {
			return '<li>' +
				util.openTag('button', {
					'data-id': book.id, 'class': book.cls, lang: book.lang, title: long ? book.title : ''
				}) +
				util.htmlEscape(long ? book.abbr : book.title) + '</button></li>';
		}
		if (book.label) {
			return '</ul><fieldset>' + (book.label === ' ' ? '' : '<legend>' + util.htmlEscape(book.label) + '</legend>') +
				open;
		}
		return '</ul></fieldset>' + open;
	});
	html = open + html.join('') + '</ul>';
	html = html.replace(/<ul[^<>]*><\/ul>/g, '');
	desc = this.collection.getDesc();
	html = (desc ? '<p>' + desc + '</p>' : '') + html;
	this.collectionTocPage.show(this.collection.getLang(), this.collection.getTitle(), html);
};

Presenter.prototype.showBookToc = function () {
	var html, desc;
	html = this.book.getSections().map(function (section, index) {
		return '<li>' + util.openTag('button', {'data-index': index, 'class': section.cls}) +
			util.htmlEscape(section.abbr) + '</button></li>';
	});
	desc = this.book.getDesc();
	html = (desc ? '<p>' + desc + '</p>' : '') + '<ul class="button-list-inline">' + html.join('') + '</ul>';
	this.bookTocPage.show(this.book.getLang(), this.book.getTitle(), html);
};

Presenter.prototype.showHistoryPage = function () {
	var html;
	html = this.history.getList().map(function (data) {
		return '<li>' + util.openTag('button', {'data-collection': data[0], 'data-book': data[1], 'data-section': data[2]}) +
			data[3] + '</button></li>';
	});
	html = '<ul class="button-list">' + html.join('') + '</ul>';
	this.historyPage.show('', 'History', html);
};

Presenter.prototype.showBookmarkList = function () {
	var html, bookmark;
	html = this.bookmarks.getList(this.book, this.collection).map(function (id) {
		bookmark = this.bookmarks.get(id);
		return '<li>' +
			util.openTag('button', {'data-href': id, 'class': bookmark.color ? ('highlight-' + bookmark.color) : ''}) +
			util.htmlEscape(bookmark.text) + '</button></li>';
	}.bind(this));
	html = html.length ? '<ul class="button-list">' + html.join('') + '</ul>' : '<p>No bookmarks</p>';
	this.bookmarkPage.show('', 'Bookmarks', html);
};

Presenter.prototype.showSpecificBook = function (collection, book, section, id) {
	var collectionPromise;
	if (this.collection && this.collection.getId() === collection) {
		collectionPromise = Promise.resolve();
	} else {
		this.showProgress();
		collectionPromise = this.library.loadCollection(collection).then(function (collection) {
			this.setCollection(collection);
		}.bind(this));
	}
	collectionPromise.then(function () {
		var bookPromise;
		if (this.book && this.book.getId() === book) {
			bookPromise = Promise.resolve();
		} else {
			this.showProgress();
			bookPromise = this.collection.loadBook(book).then(function (book) {
				this.setBook(book);
			}.bind(this));
		}
		return bookPromise;
	}.bind(this)).then(function () {
		this.hideProgress();
		this.showBook(Number(section), id);
	}.bind(this), function (e) {
		this.hideProgress();
		this.showError('Error loading specific book: ' + e);
		this.showLibraryToc();
	}.bind(this));
};

Presenter.prototype.showBookRef = function (book, id, ids, linkHtml) {
	var section;
	if (this.book && this.book.getId() === book) {
		if (!id) {
			this.showBook(0);
		} else if (this.book.hasId(id)) {
			if (linkHtml) {
				this.showFootnote(
					util.openTag('a', {href: '#' + id, 'data-ref': ids}) + linkHtml + '</a>: ' +
					this.book.getReference((ids && ids.split(' ')) || [id])
				);
			} else {
				section = this.book.getSectionIndexForId(id);
				this.bookScroller.setSection(section, id, ids);
			}
		} else {
			this.showError('Ref not found');
		}
	} else if (this.collection && this.collection.hasBook(book)) {
		this.showProgress();
		this.collection.loadBook(book).then(function (book) {
			this.hideProgress();
			if (!id) {
				this.setBook(book);
				this.showBook(0);
			} else if (book.hasId(id)) {
				if (linkHtml) {
					this.showFootnote(
						util.openTag('a', {href: '#' + id}) + linkHtml + '</a>: ' +
						book.getReference((ids && ids.split(' ')) || [id])
					);
				} else {
					this.setBook(book);
					this.showBook(this.book.getSectionIndexForId(id), id, ids);
				}
			} else {
				this.showError('Ref not found');
			}
		}.bind(this), function (e) {
			this.hideProgress();
			this.showError('Error loading book: ' + e);
		}.bind(this));
	} else {
		this.showError('Book not found');
	}
};

Presenter.prototype.showBook = function (section, id, ids) {
	this.bookScroller.setSection(section, id, ids);
	this.bookPage.show(this.book.getLang());
};

Presenter.prototype.showFootnote = function (html) {
	this.footnotePopup.show(this.book.getLang(), '', html);
	this.footnotePopup.scrollTop();
};

Presenter.prototype.showBookmark = function (text, id) {
	this.bookmarkId = id;
	this.bookmarkPopup.show('', '', util.htmlEscape(text));
	this.bookmarkPopup.scrollTop();
};

Presenter.prototype.getDefaultBookmarkText = function (id) {
	return this.book.getAbbr(this.book.getSectionIndexForId(id), id) + ' ';
};

Presenter.prototype.editBookmark = function (id) {
	var mark = this.bookmarks.get(id), input;
	this.bookmarkId = id;
	input = document.getElementById('bookmarkedit-text');
	input.value = mark ? mark.text : this.getDefaultBookmarkText(id);
	document.querySelector('[name="highlight"][value="' + (mark ? mark.color : 0) + '"]').checked = true;
	this.bookmarkeditPopup.show();
	/*l = input.value.length;
	input.focus();
	input.setSelectionRange(l, l);*/
};

Presenter.prototype.showError = function (error) {
	alert(error); //TODO? similar to progress?
};

return Presenter;
})();