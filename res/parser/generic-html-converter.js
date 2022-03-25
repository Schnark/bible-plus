/*global GenericHtmlConverter: true*/
/*global AbstractBookBuilder*/
/*global Promise*/
GenericHtmlConverter =
(function () {
"use strict";

function GenericHtmlConverter () {
}

GenericHtmlConverter.prototype.getBookBuilderConstructor = function () {
	return AbstractBookBuilder;
};

GenericHtmlConverter.prototype.convertDocs = function (docPromises) {
	return docPromises.map(function (docPromise, i) {
		return docPromise.then(function (doc) {
			var Builder = this.getBookBuilderConstructor();
			this.book = new Builder({
				id: this.meta.id,
				lang: this.meta.lang
			});
			this.convertDoc(doc, i);
			return this.book.getHTML(true);
		}.bind(this));
	}.bind(this));
};

GenericHtmlConverter.prototype.combineDocs = function (docs) {
	var Builder = this.getBookBuilderConstructor(),
		book = new Builder({
			id: this.meta.id,
			lang: this.meta.lang,
			title: this.meta.title,
			cls: this.meta.cls,
			abbr: this.meta.abbr,
			desc: this.meta.desc
		});
	return {
		id: this.meta.id,
		lang: this.meta.lang,
		title: this.meta.title,
		abbr: this.meta.abbr,
		cls: this.meta.cls,
		html: book.getArticleTag() + docs.join('\n') + '\n</article>'
	};
};

GenericHtmlConverter.prototype.parse = function (docPromises, data) {
	return docPromises[0].then(function (doc) {
		this.meta = this.getMetadata(doc, data);
		return Promise.all(this.convertDocs(docPromises)).then(this.combineDocs.bind(this));
	}.bind(this));
};

return GenericHtmlConverter;

})();