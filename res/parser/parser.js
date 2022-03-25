/*global util*/
/*global Promise*/
(function () {
"use strict";

function AbstractParser () {
}

AbstractParser.prototype.init = function (data) {
	this.data = {};
	this.data.lang = data.lang;
	this.data.title = data.title;
	this.data.type = data.type || 'bible';
	this.data.abbr = data.abbr;
	this.data.sort = data.sort || '';
	this.data.desc = data.desc || '';
	this.data.books = [];
	this.bookStr = {};
};

AbstractParser.prototype.addBook = function (data) {
	var lang = data.lang || '';
	if (lang === this.data.lang) {
		lang = '';
	}
	this.bookStr[data.id] = data.html;
	this.data.books.push({
		id: data.id,
		lang: lang,
		title: data.title,
		abbr: data.abbr,
		cls: data.cls || ''
	});
};

AbstractParser.prototype.openGroup = function (label) {
	this.data.books.push({label: label});
};

AbstractParser.prototype.closeGroup = function () {
	this.data.books.push({});
};

AbstractParser.prototype.fixBooks = function () {
	var i, book, bookMap = {}, refRe;

	function fixBook (html) {
		return html.split(/(<[^>]*>)/).map(function (part, i) {
			if (i % 2) {
				if (part.indexOf('data-content="') > -1) {
					return part.replace(/data-content="([^"]*)"/, function (all, fn) {
						fn = fn
							.replace(/&lt;/g, '<')
							.replace(/&gt;/g, '>')
							.replace(/&quot;/g, '"')
							.replace(/&amp;/g, '&');
						fn = addLinks(fn);
						fn = fixTypography(fn);
						return 'data-content="' + util.htmlEscape(fn) + '"';
					});
				} else {
					return part;
				}
			} else {
				part = fixTypography(part);
				return part;
			}
		}).join('');
	}

	function fixTypography (html) {
		return html
			.replace(/ -([\s,])/g, '&nbsp;–$1')
			.replace(/ \//g, '<span class="punct">&nbsp;/</span>');
	}

	function addLinks (html) {
		return html.replace(refRe, function (all, book, section, verse, end) {
			var id, ids = [], i;
			id = bookMap[book] + '-' + section + '-' + verse;
			if (end && Number(verse) < Number(end)) {
				for (i = Number(verse); i <= Number(end); i++) {
					ids.push(bookMap[book] + '-' + section + '-' + i);
				}
			}
			return '<a href="#' + id + '" ' + (ids.length ? 'data-ref="' + ids.join(' ') + '" ' : '') + 'class="preview">' + all + '</a>';
		});
	}

	for (i = 0; i < this.data.books.length; i++) {
		book = this.data.books[i];
		if (book.id) {
			bookMap[book.abbr] = book.id;
			bookMap[book.title] = book.id;
			//this is actually just for Psalm -> Psalms/Psalmen
			if (book.title.length >= 6 && !bookMap[book.title.slice(0, -1)]) {
				bookMap[book.title.slice(0, -1)] = book.id;
			}
			if (book.title.length >= 7 && !bookMap[book.title.slice(0, -2)]) {
				bookMap[book.title.slice(0, -2)] = book.id;
			}
		}
	}
	refRe = new RegExp('(' + Object.keys(bookMap).map(util.reEscape).join('|') + ')' +
		' (\\d+)\\W{1,2}(\\d+)(?:\\s*[\\-–]\\s*(\\d+))?', 'g'); //TODO range
	for (i = 0; i < this.data.books.length; i++) {
		book = this.data.books[i];
		if (book.id) {
			this.bookStr[book.id] = fixBook(this.bookStr[book.id]);
		}
	}
};

AbstractParser.prototype.getData = function () {
	return {
		data: this.data,
		books: this.bookStr
	};
};

var registeredParsers = [];

function initAndRegister (Parser) {
	Parser.prototype = new AbstractParser();
	registeredParsers.push(Parser);
}

function selectParserForName (name) {
	var i, Parser;
	for (i = 0; i < registeredParsers.length; i++) {
		Parser = registeredParsers[i];
		if (Parser.matchesName && Parser.matchesName(name.toLowerCase())) {
			return Parser;
		}
	}
}

function selectParserForZip (files) {
	var i, Parser;
	for (i = 0; i < registeredParsers.length; i++) {
		Parser = registeredParsers[i];
		if (Parser.matchesZip && Parser.matchesZip(files)) {
			return Parser;
		}
	}
}

function internalParse (name, read) {
	var Parser = selectParserForName(name);
	if (!Parser) {
		return Promise.reject('Unknown format');
	}
	return read(Parser.type || 'text').then(function (data) {
		var parser = new Parser(data);
		return parser.parse();
	});
}

function ZipParser (zip) {
	this.zip = zip;
}

ZipParser.matchesName = function (name) {
	return name.slice(-4) === '.zip';
};

ZipParser.type = 'zip';

initAndRegister(ZipParser);

ZipParser.prototype.parse = function () {
	var files = this.zip.getEntries(), Parser, parser;
	if (files.length === 1) {
		return internalParse(files[0], function (type) {
			return Promise.resolve(util.file.extractZip(this.zip, files[0], type));
		}.bind(this));
	}
	Parser = selectParserForZip(files);
	if (!Parser) {
		return Promise.reject('Unknown format');
	}
	parser = new Parser(this.zip);
	return parser.parse();
};

function parseUrl (url) {
	return internalParse(url, function (type) {
		return util.file.loadUrl(url, type);
	});
}

function parseFile (file) {
	return internalParse(file.name, function (type) {
		return util.file.readFile(file, type);
	});
}

//TODO irgendwo anders hin?
util.initAndRegisterParser = initAndRegister;
util.parseUrl = parseUrl;
util.parseFile = function (file) {
	if (file) {
		return parseFile(file);
	}
	return util.file.pickFile().then(parseFile);
};

})();