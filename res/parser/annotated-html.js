/*global util*/
(function () {
"use strict";

//TODO -> util?
function getLang (el) {
	el = util.getParent(el, function (el) {
		return !!el.lang;
	});
	return el ? el.lang : '';
}

function AnnotatedHtmlParser (doc) {
	this.doc = doc;
}

AnnotatedHtmlParser.matchesName = function (name) {
	return name.slice(-5) === '.html';
};

AnnotatedHtmlParser.type = 'html';

util.initAndRegisterParser(AnnotatedHtmlParser);

AnnotatedHtmlParser.prototype.parseElement = function (el) {
	var els = el.children, i, lang;
	for (i = 0; i < els.length; i++) {
		el = els[i];
		if (el.tagName === 'DIV') {
			this.openGroup(el.title);
			this.parseElement(el);
			this.closeGroup();
		} else if (el.tagName === 'ARTICLE') {
			lang = getLang(el);
			el.setAttribute('lang', lang); //force lang attribute on element
			this.addBook({
				id: el.id,
				lang: lang,
				title: el.title,
				abbr: el.dataset.abbr,
				cls: el.className,
				html: el.outerHTML
			});
		}
	}
};

AnnotatedHtmlParser.prototype.parse = function () {
	var style = this.doc.getElementsByTagName('style')[0],
		base = this.doc.getElementsByTagName('body')[0];
	if (['bible', 'doc', 'help', 'test'].indexOf(base.dataset.type) === -1) {
		throw new Error('Unknown type: ' + base.dataset.type);
	}
	this.init({
		lang: getLang(base),
		title: this.doc.title,
		type: base.dataset.type,
		abbr: base.dataset.abbr,
		sort: base.dataset.sort,
		desc: base.dataset.desc,
		css: style ? style.textContent : ''
	});
	this.parseElement(base);
	return this.getData();
};

})();