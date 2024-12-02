/*global util, bibleData, BibleBuilder*/
/*global console*/
(function () {
"use strict";

function normalizeLang (lang) {
	var map = {
		ger: 'de'
		//TODO
	};
	return map[(lang || '').toLowerCase()] || lang || '';
}

function parseInformationTag (tag) {
	var children = tag.childNodes, i, el, data = {};
	for (i = 0; i < children.length; i++) {
		el = children[i];
		switch (el.nodeName.toLowerCase()) {
		case 'title':
			data.title = el.textContent;
			break;
		case 'description':
			data.desc = (data.desc ? data.desc + '<br>' : '') + el.textContent;
			break;
		case 'identifier':
			data.abbr = el.textContent;
			break;
		case 'language':
			data.lang = normalizeLang(el.textContent);
		}
	}
	data.abbr += ' [' + data.lang + ']';
	return data;
}

function parseInlineTag (tag) {
	var children = tag.childNodes, i, el, html = [];
	for (i = 0; i < children.length; i++) {
		el = children[i];
		switch (el.nodeName.toLowerCase()) {
		case '#cdata-section':
		case '#text':
			html.push(util.htmlEscape(el.textContent.replace(/\n/g, ' ')));
			break;
		case 'br':
			html.push(el.getAttribute('art') === 'x-nl' ? '<br>' : '\n');
			break;
		case 'style':
		case 's':
		case 'st':
		case 'sup':
			html.push(parseStyleTag(el));
			break;
		case 'gram':
		case 'g':
		case 'gr':
			html.push(parseGrammerTag(el));
			break;
		case 'note':
		case 'n':
		case 'remark':
		case 'r':
			html.push(parseNoteTag(el));
			break;
		case 'xref':
		case 'xr':
			html.push(parseRefTag(el));
			break;
		case 'div': //not in standard, but in some documents
			html.push(parseInlineTag(el));
			break;
		default:
			console.warn('Unknown tag "' + el.nodeName + '"');
			html.push(parseInlineTag(el));
		}
	}
	return html.join('');
}

function getOsisStyle (css) {
	var res = /\bosis-style:\s*([^;]+)/.exec(css);
	if (res) {
		return 'osis-' + res[1].trim().toLowerCase();
	}
}

function wrap (start, inner, end) {
	if (inner.indexOf('\n') > -1) {
		inner = inner.replace(/ *\n+ */g, end + '\n' + start);
	}
	return start + inner + end;
}

function parseStyleTag (tag) {
	var html = parseInlineTag(tag),
		type = tag.getAttribute('fs') || tag.getAttribute('art'),
		css = tag.getAttribute('css');
	if (css) {
		type = getOsisStyle(css) || type;
	}
	if (!type && css) {
		return wrap('<span style="' + util.htmlEscape(css.replace(/\n+/g, ' ')) + '">', html, '</span>');
	}
	switch (type) {
	case 'acrostic': return wrap('<abbr>', html, '</abbr>');
	case 'bold': return wrap('<b>', html, '</b>');
	case 'emphasis': return wrap('<em>', html, '</em>');
	case 'illuminated': return html; //TODO?
	case 'italic': return wrap('<i>', html, '</i>');
	case 'line-through': return wrap('<s>', html, '</s>');
	case 'normal': return html;
	case 'small-caps': return wrap('<span style="font-variant: small-caps;">', html, '</span>');
	case 'x-sub': //for <sup art>
	case 'sub': return wrap('<sub>', html, '</sub>');
	case 'x-sup': //for <sup art>
	case 'super': return wrap('<sup>', html, '</sup>');
	case 'underline': return wrap('<u>', html, '</u>');
	case 'overline': return wrap('<span style="text-decoration: overline;">', html, '</span>');
	case 'capitalize': return wrap('<span style="text-transform: capitalize;">', html, '</span>');
	case 'uppercase': return wrap('<span style="text-transform: uppercase;">', html, '</span>');
	case 'lowercase': return wrap('<span style="text-transform: lowercase;">', html, '</span>');
	case 'osis-divine-name':
	case 'divineName': return wrap('<span class="divine-name">', html, '</span>');
	case 'small': return wrap('<small>', html, '</small>');
	case 'osis-added': return wrap('<span class="edit-added">', html, '</span>');
	case 'osis-deleted': return wrap('<span class="edit-removed">', html, '</span>');
	case 'osis-alternative': return wrap('<span class="edit-alternative">', html, '</span>');
	default:
		console.warn('Unknown style "' + type + '"');
		return html;
	}
}

function parseGrammerTag (tag) {
	var strong = tag.getAttribute('str') || '', //TODO formatieren
		rmac = tag.getAttribute('rmac') || '',
		grammer;
	grammer = strong + (strong && rmac ? ' ' : '') + rmac;
	grammer = grammer.replace(/\n+/g, ' ');
	return grammer ?
		wrap(util.openTag('span', {'data-grammer': grammer}), parseInlineTag(tag), '</span>') :
		parseInlineTag(tag);
}

function parseNoteTag (tag) {
	return makeFootnote(parseInlineTag(tag));
}

function parseRefTag (tag) {
	return util.createFootnote(tag.getAttribute('fscope').replace(/\n+/g, ' ')); //TODO
}

function makeFootnote (content) {
	content = content.trim();
	if (content.indexOf('\n') > -1) {
		content = '<p>' + content.replace(/ *\n+ */g, '</p><p>') + '</p>';
	}
	return util.createFootnote(content);
}

function ZefaniaParser (doc) {
	this.doc = doc;
}

ZefaniaParser.matchesName = function (name) {
	return name.slice(-4) === '.xml';
};

ZefaniaParser.type = 'xml';

util.initAndRegisterParser(ZefaniaParser);

ZefaniaParser.prototype.initAndGetBookTags = function (base) {
	var children = base.childNodes, i, el, info, books = [];
	if ((base.getAttribute('type') || 'x-bible') !== 'x-bible') {
		throw new Error('Unknown type "' + base.getAttribute('type') + '"');
	}
	for (i = 0; i < children.length; i++) {
		el = children[i];
		switch (el.nodeName.toLowerCase()) {
		case 'information':
		case 'i':
			info = parseInformationTag(el);
			this.lang = info.lang;
			this.init(info);
			break;
		case 'biblebook':
		case 'b':
			books.push(el);
		}
	}
	return books;
};

ZefaniaParser.prototype.parseBiblebookTag = function (tag) {
	var children = tag.childNodes, i, el, data;
	data = bibleData.getBookByZefaniaNumber(tag.getAttribute('bnumber'), this.lang);
	if (!data) {
		console.warn('Unknown book with number ' + tag.getAttribute('bnumber'));
		return;
	}
	data.lang = this.lang;
	data.title = tag.getAttribute('bname') || data.title;
	data.abbr = tag.getAttribute('bsname') || data.abbr;
	this.book = new BibleBuilder({id: data.id, lang: this.lang, title: data.title, abbr: data.abbr});
	for (i = 0; i < children.length; i++) {
		el = children[i];
		switch (el.nodeName.toLowerCase()) {
		case 'prolog':
		case 'p':
			this.book.section(0);
			this.addInlineContent(el);
			break;
		case 'chapter':
		case 'c':
			this.parseChapterTag(el);
			break;
		case '#cdata-section':
		case '#text':
			if (el.textContent.trim()) {
				console.warn('Text outside tags: "' + el.textContent + '"');
			}
			break;
		default:
			console.warn('Unknown tag "' + el.nodeName + '" inside book');
		}
	}
	data.html = this.book.getHTML().replace(/(<span class="id">[^<]+<\/span>)(<br>)/g, '$2$1');
	this.addBook(data);
};

ZefaniaParser.prototype.parseChapterTag = function (tag) {
	var children = tag.childNodes, i, el;
	this.book.section(tag.getAttribute('cnumber'));
	for (i = 0; i < children.length; i++) {
		el = children[i];
		switch (el.nodeName.toLowerCase()) {
		case 'prolog':
		case 'p':
			this.book.verse();
			this.book.inline(makeFootnote(parseInlineTag(el)));
			break;
		case 'caption':
		case 'ca':
			this.parseCaptionTag(el);
			break;
		case 'vers':
		case 'v':
			this.parseVerseTag(el);
			break;
		case '#cdata-section':
		case '#text':
			if (el.textContent.trim()) {
				console.warn('Text outside tags: "' + el.textContent + '"');
			}
			break;
		default:
			console.warn('Unknown tag "' + el.nodeName + '" inside chapter');
		}
	}
};

ZefaniaParser.prototype.parseCaptionTag = function (tag) {
	var h = tag.getAttribute('type') || 'x-h2';
	h = h.slice(-1);
	if (h > '6' || h < '1') {
		h = '2';
	}
	this.book.block('<h' + h + '>' + parseInlineTag(tag).trim() + '</h' + h + '>');
};

ZefaniaParser.prototype.parseVerseTag = function (tag) {
	this.book.verse(tag.getAttribute('vnumber'));
	this.addInlineContent(tag);
};

ZefaniaParser.prototype.addInlineContent = function (tag) {
	var html = parseInlineTag(tag).trim().split(/ *\n+ */), i;
	for (i = 0; i < html.length; i++) {
		if (i > 0) {
			this.book.paragraph();
		}
		this.book.inline(html[i]);
	}
};

ZefaniaParser.prototype.parse = function () {
	var books = this.initAndGetBookTags(
		this.doc.getElementsByTagName('XMLBIBLE')[0] ||
		this.doc.getElementsByTagName('xmlbible')[0] ||
		this.doc.getElementsByTagName('x')[0]
	), i;
	for (i = 0; i < books.length; i++) {
		this.parseBiblebookTag(books[i]);
	}
	this.fixBooks();
	return this.getData();
};

})();