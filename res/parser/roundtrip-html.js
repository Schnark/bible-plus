/*global GenericHtmlConverter, BookBuilder, BibleBuilder, util*/
/*global Promise, console*/
(function () {
"use strict";

//see https://github.com/schierlm/BibleMultiConverter
function RoundtripHtmlConverter () {
}

RoundtripHtmlConverter.prototype = new GenericHtmlConverter();

RoundtripHtmlConverter.prototype.getMetadata = function (dummy, data) {
	var specialIds = {
		'x-Intr': 'intro',
		'x-IntrOT': 'ot',
		'x-IntrNT': 'nt',
		'x-App': 'appendix'
	};
	this.isSpecialBook = data.osis in specialIds;
	this.strongPrefix = data.nt ? 'G' : 'H';
	return {
		id: specialIds[data.osis] || data.osis.toLowerCase(),
		lang: data.lang,
		title: data.long,
		cls: data.type === 'meta' ? 'intro' : '',
		abbr: data.abbr
	};
};

RoundtripHtmlConverter.prototype.getBookBuilderConstructor = function () {
	return this.isSpecialBook ? BookBuilder : BibleBuilder;
};

RoundtripHtmlConverter.prototype.getFnHtml = function (el) {
	try {
		return this.doc.getElementsByName(
			el.getElementsByTagName('a')[0].getAttribute('href').slice(1)
		)[0].parentElement.parentElement.innerHTML.replace(/<sup class="fnt">.*?<\/sup> */, '');
	} catch (e) {
		return '?';
	}
};

RoundtripHtmlConverter.prototype.convertGrammer = function (classes) {
	return classes.map(function (g) {
		if (g.slice(0, 2) === 'gs') {
			return this.strongPrefix + g.slice(2);
		} else if (g.slice(0, 3) === 'gr-') {
			return g.slice(3).toUpperCase();
		} else {
			return '';
		}
	}.bind(this)).filter(function (g) {
		return g;
	}).join(' ');
};

RoundtripHtmlConverter.prototype.convertElement = function (el) {
	util.walkElement(el, function (name, attr, el) {
		var cls = (attr && attr['class']) || '';
		switch (name) {
		case '':
			this.book.inline(attr);
			return;
		case 'div': return true;
		case 'i':
			this.book.inline('<' + (attr ? '' : '/') + 'i>');
			return true;
		case 'b':
			this.book.inline('<' + (attr ? '' : '/') + 'em>');
			return true;
		case 'br': return;
		case 'h1': case 'h2': case 'h3': case 'h4': case 'h5':
			this.book.block('<' + name + '>' + util.htmlEscape(el.textContent.trim()) + '</' + name + '>');
			return;
		case 'sup':
			if (cls === 'fnm') {
				this.book.inline(util.createFootnote(this.getFnHtml(el), '[' + el.textContent + ']', 'sup'));
			} else {
				console.warn('Unexpected sup');
			}
			return;
		case 'span':
			if (!attr) {
				this.book.inline('</span>');
				return;
			}
			switch (cls) {
			case 'vn':
				this.book.verse(el.textContent);
				break;
			case 'br-p':
				this.book.paragraph();
				break;
			case 'br-ind':
				this.book.inline('<br><span class="indention"></span>');
				break;
			case 'css':
				this.book.inline(util.openTag('span', {style: attr.style}));
				return true;
			default:
				if (cls.slice(0, 2) === 'g ') {
					this.book.inline(util.openTag('span', {'data-grammer': this.convertGrammer(cls.split(' '))}));
					return true;
				}
				if (cls.slice(0, 3) === 'xa ') {
					return;
				}
				console.warn('Unexpected span: ' + el.outerHTML);
			}
			return;
		default:
			console.warn('Unexpected tag "' + name + '"');
			return true;
		}
	}.bind(this), true);
};

RoundtripHtmlConverter.prototype.convertDoc = function (doc, i) {
	var prolog = doc.getElementsByClassName('prolog')[0],
		verses = doc.getElementById('verses');
	this.doc = doc;
	if (prolog) {
		this.book.section(this.isSpecialBook ? 1 : 0);
		this.convertElement(prolog);
	}
	if (verses) {
		this.book.section(i + 1);
		this.convertElement(verses);
	}
};

function parseMetadata (str) {
	/*jshint evil: true*/
	return eval( //FIXME
		'({' +
		str.replace(/\=/g, ':').replace(/;/g, ',') +
		'dummy:0})'
	);
}

function RoundtripHtmlParser (zip) {
	this.zip = zip;
}

RoundtripHtmlParser.matchesZip = function (files) {
	return files.indexOf('metadata.js') > -1 || files.some(function (name) {
		return name.slice(-12) === '/metadata.js';
	});
};

util.initAndRegisterParser(RoundtripHtmlParser);

RoundtripHtmlParser.prototype.getPath = function () {
	var files = this.zip.getEntries(), path = '', i, name;
	for (i = 0; i < files.length; i++) {
		name = files[i];
		if (name === 'metadata.js') {
			break;
		}
		if (name.slice(-12) === '/metadata.js') {
			path = name.slice(0, -11);
			break;
		}
	}
	return path;
};

RoundtripHtmlParser.prototype.getMetadata = function () {
	return parseMetadata(util.file.extractZip(this.zip, this.path + 'metadata.js', 'text'));
};

RoundtripHtmlParser.prototype.getDocPromises = function (data) {
	var pre = this.path + data.type + '/' + data.abbr + '_', promises = [], i;
	for (i = 1; i <= data.chapters; i++) {
		promises.push(Promise.resolve(util.file.extractZip(this.zip, pre + i + '.html', 'html')));
	}
	return promises;
};

RoundtripHtmlParser.prototype.parseBook = function (data) {
	var converter = new RoundtripHtmlConverter();
	data.lang = this.lang;
	return converter.parse(this.getDocPromises(data), data);
};

RoundtripHtmlParser.prototype.parse = function () {
	var metadata;
	this.path = this.getPath();
	metadata = this.getMetadata();
	this.lang = 'de'; //TODO
	this.init({
		lang: this.lang,
		title: metadata.biblename,
		type: 'bible',
		abbr: (metadata.biblename.replace(/[^A-Z0-9]+/g, '') || metadata.biblename) + ' [' + this.lang + ']', //TODO
		desc: ''
	});
	return Promise.all(metadata.metadata.map(this.parseBook.bind(this))).then(function (books) {
		var i;
		for (i = 0; i < books.length; i++) {
			this.addBook(books[i]);
		}
		this.fixBooks();
		return this.getData();
	}.bind(this));
};

})();