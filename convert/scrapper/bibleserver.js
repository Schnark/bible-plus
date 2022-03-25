/*global util, BibleBuilder, GenericHtmlConverter*/
/*global console*/
(function () {
"use strict";

function BibleserverHtmlConverter () {
}

BibleserverHtmlConverter.getUrl = function (id) {
	var idparts = id.split(':');
	if (idparts.length < 3) {
		idparts.shift('EU');
	}
	if (idparts.length < 3) {
		idparts.push('1');
	}
	return 'https://www.bibleserver.com/' + idparts[0] + '/' + idparts[1] + '_' + idparts[2] + '_';
};

BibleserverHtmlConverter.prototype = new GenericHtmlConverter();

BibleserverHtmlConverter.prototype.getMetadata = function (doc, data) {
	var abbr = data.url.replace(/.*\//, '').replace(/_.*/, '') || 'Mk'; //FIXME
	return {
		id: abbr.toLowerCase(), //FIXME
		lang: doc.lang || 'de',
		title: doc.title.replace(/ +\d.*/, ''),
		abbr: abbr
	};
};

BibleserverHtmlConverter.prototype.getBookBuilderConstructor = function () {
	return BibleBuilder;
};

BibleserverHtmlConverter.prototype.addContent = function (base) {
	function readInline (element, baseTag) {
		return util.convertElement(element, function (tag, data) {
			if (data['class'] === 'd-sr-only') {
				return false;
			}
			if (tag !== 'span' && tag !== baseTag) {
				console.warn('Unexpected tag "' + tag + '"');
			}
			return true;
		}, true).trim();
	}

	util.walkElement(base, function (tag, data, el) {
		var cls, text;
		if (tag && data) {
			cls = data['class'];
		}
		if (tag === 'article') {
			return true;
		}
		if (tag === 'noscript' || tag === 'header' || tag === 'footer' || cls === 'chapter-border') {
			return false;
		}
		if (tag === 'h3') {
			this.book.block('<h2>' + util.htmlEscape(readInline(el, 'h3')) + '</h2>');
			return false;
		}
		if (cls === 'd-sr-only') {
			return false;
		}
		if (cls === 'verse-number') {
			this.book.verse(el.textContent.trim());
			return false;
		}
		if (cls === 'verse-references') {
			this.book.inline(util.createFootnote(el.textContent.trim()));
			return false;
		}
		if (cls === 'footnote') {
			//this.book.inline(util.createFootnote('???', readInline(el)));
			return false;
		}
		if (tag) {
			if (['b', 'i'].indexOf(tag) > -1) {
				this.book.inline('<' + (data ? '' : '/') + tag + '>');
			} else {
				if (['span'].indexOf(tag) === -1) {
					console.warn('Unexpected tag "' + tag + '"');
				}
			}
			if (data) {
				return true;
			}
		} else {
			text = util.htmlEscape(data).trim().replace(/ - /g, ' – ');
			if (text) {
				this.book.inline(text);
			}
		}
	}.bind(this), true);
};

BibleserverHtmlConverter.prototype.convertDoc = function (doc, index) {
	this.book.section(index + 1);
	this.addContent(doc.getElementById('main-content').getElementsByTagName('article')[0]);
};

util.converters.bibleserver = BibleserverHtmlConverter;
util.converters['bibleserver-debug'] = BibleserverHtmlConverter;

})();