/*global util, BookBuilder, GenericHtmlConverter*/
(function () {
"use strict";

function VaticanHtmlConverter () {
}

VaticanHtmlConverter.getUrl = function (url) {
	return url;
};

VaticanHtmlConverter.prototype = new GenericHtmlConverter();

VaticanHtmlConverter.prototype.getMetadata = function (doc) {
	function getMeta (name, fallback) {
		var el = doc.querySelector('meta[name="' + name + '"]');
		return el ? el.content : fallback;
	}

	var title = doc.title, id;
	id = title.toLowerCase().replace(/[^a-z ]/g, '').trim();
	id = id.charAt(0) + id.charAt(id.indexOf(' ') + 1);
	id += getMeta('date', '').slice(0, 4); //not perfect, but quite good
	return {
		id: id,
		lang: getMeta('language'),
		title: title,
		abbr: id.toUpperCase().replace(/\d+/g, ''),
		desc: getMeta('description')
	};
};

VaticanHtmlConverter.prototype.getBookBuilderConstructor = function () {
	return BookBuilder;
};

VaticanHtmlConverter.prototype.addHead = function (content, level) {
	content = content.trim();
	if (content) {
		if (content === content.toUpperCase()) {
			content = content.toLowerCase().replace(/(^| ) *(.)/g, function (all, s, a) {
				return s + a.toUpperCase();
			});
		}
		this.book.block('<' + level + '>' + util.htmlEscape(content) + '</' + level + '>');
	}
};

VaticanHtmlConverter.prototype.fixHtml = function (html) {
	return html.replace(/(<[bi]>) /g, ' $1')
		.replace(/ (<\/[bi]>)/g, '$1 ')
		.replace(/<(i|b)>\s*<\/\1>/g, '')
		.replace(/\n/g, ' ')
		.replace(/ {2,}/g, ' ');
};

VaticanHtmlConverter.prototype.addParagraph = function (html) {
	var digits;
	html = html.replace(/\u00A0/g, '&nbsp;').replace(/^(?:\s|&nbsp;)+|(?:\s|&nbsp;)+$/, '');
	if (!html) {
		return;
	}
	digits = /^(?:<b>|<a name="\d+">)?(\d+)\.?(?:\s|&nbsp;)*(?:<\/b>|<\/a>)?\.?(?:\s|&nbsp;)*/.exec(html);
	if (digits) {
		this.book.verse(digits[1]);
		html = html.slice(digits[0].length);
	}
	this.book.paragraph();
	this.addHTML(html);
};

VaticanHtmlConverter.prototype.getFootnote = function (id) {
	var el = this.doc.getElementById(id.slice(1)); //id is actually the name of the backlink, the real id is that without the leading underscore
	if (!el) {
		el = util.getParent(this.doc.querySelector('a[name="' + id + '"]'), 'P') ||
		util.getParent(this.doc.querySelector('a[name="' + id + '"]'), 'DIV');
	}
	if (!el) {
		return '???';
	}
	return this.fixHtml(util.tidy(el.innerHTML.replace(/<a [^<>]*href=["'][^\/]*#[^<>]*>(?:<sup>)*\[\d+\](?:<\/sup>)*<\/a>/, ''), ['i', 'b'])).trim();
};

VaticanHtmlConverter.prototype.addHTML = function (html, block) {
	var chunks = html.split(/(<a [^<>]*href=["'][^\/]*#[^<>]*>(?:<sup>)*\[\d+\](?:<\/sup>)*<\/a>)/), i, fn;
	for (i = 0; i < chunks.length; i++) {
		if (i % 2 === 0) {
			this.book[block ? 'block' : 'inline'](this.fixHtml(util.tidy(chunks[i], ['i', 'b', 'br'])));
		} else {
			fn = /<a [^<>]*href=["'][^\/]*#([^<>"']*)[^<>]*>(?:<sup>)*(\[\d+\])(?:<\/sup>)*<\/a>/.exec(chunks[i]);
			this.book[block ? 'block' : 'inline'](util.createFootnote(this.getFootnote(fn[1]), fn[2]));
		}
	}
};

VaticanHtmlConverter.prototype.convertBlock = function (base) {
	var els = base.childNodes, i, el, text, tag, attr, head, pos;

	function isHead (tag, attr, el) {
		if (tag === 'p' && attr.align) {
			return 'h2';
		}
		if (tag === 'p' && el.childNodes.length === 1 && el.childNodes[0].tagName === 'B') {
			return 'h3';
		}
		if (tag === 'p' && el.childNodes.length === 1 && el.childNodes[0].tagName === 'I') {
			return 'h4';
		}
		if (tag === 'font' && el.textContent.length <= 100) {
			return 'h3';
		}
	}

	for (i = 0; i < els.length; i++) {
		el = els[i];
		if (el.nodeType === 3 || el.nodeType === 4) {
			text = el.textContent;
			if (text.trim()) {
				this.book.block(util.htmlEscape(text));
			}
		} else if (el.nodeType === 1) {
			tag = el.tagName.toLowerCase();
			attr = util.getAttr(el, true);
			head = isHead(tag, attr, el);
			if (head) {
				this.addHead(el.textContent, head);
			} else if (tag === 'p') {
				this.addParagraph(el.innerHTML);
			} else if (tag === 'div' || tag === 'font') {
				pos = el.textContent.indexOf('[1]');
				if (tag === 'font' || pos === -1 || pos > 15) {
					this.convertBlock(el);
				}
			} else {
				this.addHTML(el.innerHTML, true);
			}
		}
	}
};

VaticanHtmlConverter.prototype.convertDoc = function (doc) {
	var text = doc.getElementsByClassName('text'),
		i;
	if (text.length === 0) {
		text = doc.getElementsByTagName('body');
	}
	this.doc = doc;
	this.book.section(1);
	for (i = 0; i < text.length; i++) {
		this.convertBlock(text[i]);
	}
};

util.converters.vatican = VaticanHtmlConverter;

})();