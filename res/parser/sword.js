/*global BibleBuilder, bibleData, util, pako*/
/*global TextDecoder, Promise, console*/
(function () {
"use strict";

//TODO util?
function slice (array, start, end) {
	if (array.slice) {
		return array.slice(start, end);
	}
	return Array.prototype.slice.call(array, start, end);
}

function parseConf (text) {
	var data = {};
	text.split('\n').forEach(function (line) {
		var pos;
		if (line.charAt(0) === '[' && line.charAt(line.length - 1) === ']') {
			data[''] = line.slice(1, -1);
			return;
		}
		pos = line.indexOf('=');
		if (pos === -1) {
			return;
		}
		data[line.slice(0, pos).toLowerCase()] = line.slice(pos + 1);
	});
	return data;
}

function parseBZS (arraybuffer) {
	var data = new DataView(arraybuffer), l = arraybuffer.byteLength / 12, i, books = [];
	for (i = 0; i < l; i++) {
		books.push({
			start: data.getUint32(12 * i, true),
			length: data.getUint32(12 * i + 4, true)
			//uncompressed: data.getUint32(12 * i + 8, true)
		});
	}
	return books;
}

function parseBZV (arraybuffer) {
	var data = new DataView(arraybuffer), l = arraybuffer.byteLength / 10, i, verses = [];
	for (i = 0; i < l; i++) {
		verses.push({
			booknum: data.getUint16(10 * i, true),
			start: data.getUint16(10 * i + 2, true) * 0x100000000 + data.getUint32(10 * i + 4, true),
			length: data.getUint16(10 * i + 8, true)
		});
	}
	return verses;
}

function parseBZZ (arraybuffer, bzs) {
	return bzs.map(function (entry) {
		return pako.inflate(arraybuffer.slice(entry.start, entry.start + entry.length));
	});
}

function extractVerses (bzz, bzv) {
	var decoder = new TextDecoder();
	return bzv.map(function (verse) {
		return decoder.decode(slice(bzz[verse.booknum], verse.start, verse.start + verse.length));
	});
}

function getQuotes (lang) {
	switch (lang) {
	case 'de': return [['»', '«'], ['›', '‹']];
	case 'en': return [['“', '”'], ['‘', '’']];
	default: return ['&quot;', '\''];
	}
}

function repeat (str, count) {
	var strs = [];
	while (count > 0) {
		strs.push(str);
		count--;
	}
	return strs.join('');
}

function parseOsis (book, el, options) {
	var i, child, level, fn, marker, quotes;
	for (i = 0; i < el.childNodes.length; i++) {
		child = el.childNodes[i];
		switch (child.nodeName) {
		case '#text':
			book.inline(util.htmlEscape(child.textContent));
			break;
		case 'chapter':
			book.section(Number(child.getAttribute('n')));
			parseOsis(book, child, options);
			break;
		case 'verse':
			book.verse(Number(child.getAttribute('n')));
			parseOsis(book, child, options);
			book.verse(0);
			break;
		case 'title':
			//TODO more than just text content?
			level = '2'; //TODO
			if (child.getAttribute('type') === 'psalm') {
				level = '3';
			}
			book.block('<h' + level + '>' + util.htmlEscape(child.textContent) + '</h' + level + '>');
			break;
		case 'note':
			//TODO more than just text content?
			switch (child.getAttribute('type')) {
			case 'crossReference':
				fn = util.createFootnote(util.htmlEscape(child.textContent), '→', 'sup', 'inline');
				break;
			case 'study':
				fn = util.createFootnote(util.htmlEscape(child.textContent), null, null, 'info');
				break;
			default:
				fn = util.createFootnote(util.htmlEscape(child.textContent));
			}
			book.inline(fn + ' ');
			break;
		case 'q':
			marker = child.getAttribute('marker');
			if (marker === null) {
				if (options.qToTick) {
					quotes = getQuotes(options.lang);
					marker = quotes[options.level % quotes.length];
				} else {
					marker = '';
				}
			}
			if (!Array.isArray(marker)) {
				marker = [marker, marker];
			}
			if (child.getAttribute('who') === 'Jesus') {
				marker[0] = '<span class="woc">' + marker[0];
				marker[1] = marker[1] + '</span>';
			}
			book.inline(marker[0]);
			options.level++;
			parseOsis(book, child, options);
			options.level--;
			book.inline(marker[1]);
			break;
		case 'div':
			if (child.getAttribute('type') === 'paragraph') {
				book.paragraph();
			}
			parseOsis(book, child, options);
			break;
		case 'hi':
			marker = child.getAttribute('type');
			marker = {
				acrostic: ['<abbr>', '</abbr>'],
				bold: ['<b>', '</b>'],
				emphasis: ['<em>', '</em>'],
				italic: ['<i>', '</i>'],
				'line-through': ['<s>', '</s>'],
				'small-caps': ['<span style="font-variant: small-caps;">', '</span>'],
				sub: ['<sub>', '</sub>'],
				super: ['<sup>', '</sup>'],
				underline: ['<u>', '</u>']
			}[marker] || null;
			if (marker) {
				book.inline(marker[0]);
			}
			parseOsis(book, child, options);
			if (marker) {
				book.inline(marker[1]);
			}
			break;
		case 'lb':
			book.inline('<br>');
			break;
		case 'l':
			//TODO
			if (!child.getAttribute('eID')) {
				book.inline(
					(options.lgstart ? '' : '<br>') +
					repeat('<span class="indention"></span>', Number(child.getAttribute('level') || '1') - 1)
				);
			}
			options.lgstart = false;
			parseOsis(book, child, options);
			break;
		case 'lg':
			options.lgstart = true;
			/*falls through*/
		case 'milestone':
		case 'speaker':
			parseOsis(book, child, options);
			break;
		default:
			console.warn('Unknown tag ' + child.nodeName);
			//console.dir(child);
			parseOsis(book, child, options);
		}
	}
}

function SwordParser (zip) {
	this.zip = zip;
}

SwordParser.matchesZip = function (files) {
	return files.some(function (name) {
		return name.slice(-5) === '.conf';
	});
};

util.initAndRegisterParser(SwordParser);

SwordParser.prototype.getConfName = function () {
	var names = this.zip.getEntries(), i;
	for (i = 0; i < names.length; i++) {
		if (names[i].slice(-5) === '.conf') {
			return names[i];
		}
	}
	throw new Error('No SWORD format');
};

SwordParser.prototype.hasGroup = function (path) {
	var names = this.zip.getEntries();
	return names.indexOf(path + '.bzs') > -1 && names.indexOf(path + '.bzv') > -1 && names.indexOf(path + '.bzz') > -1;
};

SwordParser.prototype.parseGroup = function (path, group) {
	var bzs = parseBZS(util.file.extractZip(this.zip, path + '.bzs', 'arraybuffer')),
		bzv = parseBZV(util.file.extractZip(this.zip, path + '.bzv', 'arraybuffer')),
		bzz = parseBZZ(util.file.extractZip(this.zip, path + '.bzz', 'arraybuffer'), bzs),
		data = bibleData.getBooksBySwordGroup(group, this.lang), i; //TODO different versification
	this.verses = extractVerses(bzz, bzv);
	this.index = 0;
	for (i = 0; i < data.length; i++) {
		this.buildBook(data[i]);
	}
	if (this.verses.length !== this.index) {
		console.warn('Unexpected number of verses (' + this.verses.length + ' instead of ' + this.index + ')');
	}
};

SwordParser.prototype.buildGroup = function (path, group) {
	if (this.hasGroup(path + group)) {
		this.openGroup(bibleData.getBookById(group, this.lang).abbr);
		this.parseGroup(path + group, group);
		this.closeGroup();
	}
	return Promise.resolve(); //use a promise to allow parsing in two batches (one blocks for too long)
};

SwordParser.prototype.getNextVerse = function () {
	return this.verses[this.index++] || '';
};

SwordParser.prototype.buildBook = function (data) {
	var book = new BibleBuilder({id: data.id, lang: this.lang, title: data.title, abbr: data.abbr, cls: data.cls}),
		i, j, osis = [], html;

	for (i = -1; i < data.chapters.length; i++) {
		osis.push('<chapter n="' + (i + 1) + '">');
		for (j = 0; j <= (i === -1 ? 0 : data.chapters[i]); j++) {
			if (j) {
				osis.push('<verse n="' + j + '">');
			}
			osis.push(this.getNextVerse().replace(/<(?:chapter|verse)[^>]*>/g, ''));
			if (j) {
				osis.push('</verse>');
			}
		}
		osis.push('</chapter>');
	}
	osis = (new DOMParser()).parseFromString(
		'<div type="book">' + osis.join('\n') + '</div>',
		'application/xml'
	).documentElement;
	parseOsis(book, osis, {qToTick: this.qToTick, level: 0, lang: this.lang});

	html = book.getHTML();
	if (html) {
		this.addBook({
			id: data.id,
			lang: this.lang,
			title: data.title,
			abbr: data.abbr,
			cls: data.cls,
			html: html
		});
	}
};

SwordParser.prototype.parse = function () {
	var conf = parseConf(util.file.extractZip(this.zip, this.getConfName(), 'text')),
		path;
	if (conf.moddrv !== 'zText') {
		throw new Error('Unsupported ModDrv: ' + conf.moddrv);
	}
	if (conf.blocktype !== 'BOOK') {
		throw new Error('Unsupported BlockType: ' + conf.blocktype);
	}
	if (conf.compresstype !== 'ZIP') {
		throw new Error('Unsupported CompressType: ' + conf.compresstype);
	}
	if (conf.sourcetype !== 'OSIS') {
		throw new Error('Unsupported SourceType: ' + conf.sourcetype);
	}
	if (conf.encoding !== 'UTF-8') {
		throw new Error('Unsupported Encoding: ' + conf.encoding);
	}
	if ((conf.versification || 'KJV') !== 'KJV') {
		throw new Error('Unsupported Versification: ' + conf.versification);
	}
	path = conf.datapath || '';
	if (path.slice(0, 2) === './') {
		path = path.slice(2);
	}
	this.lang = conf.lang || 'en';
	this.qToTick = (conf.osisqtotick !== 'false');
	this.init({
		lang: this.lang,
		title: conf.description || 'Untitled',
		type: 'bible',
		abbr: conf[''] + ' [' + this.lang + ']',
		desc: util.htmlEscape(conf.about || '').replace(/\s*(?:\\par)+\s*/g, '<br>')
	});
	return this.buildGroup(path, 'ot').then(function () {
		return this.buildGroup(path, 'nt').then(function () {
			this.fixBooks();
			return this.getData();
		}.bind(this));
	}.bind(this));
};

})();