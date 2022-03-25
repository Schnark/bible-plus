/*global Page: true*/
Page =
(function () {
"use strict";

function Page (element, clickHandler, otherHandler) {
	element.hidden = true;
	this.element = element;
	this.title = element.getElementsByClassName('title')[0];
	this.body = element.getElementsByClassName('body')[0];
	this.namedElements = {};
	if (clickHandler) {
		Object.keys(clickHandler).forEach(function (cls) {
			element.getElementsByClassName(cls)[0].addEventListener('click', clickHandler[cls]);
		});
	}
	if (otherHandler) {
		Object.keys(otherHandler).forEach(function (event) {
			this.body.addEventListener(event, otherHandler[event]);
		}.bind(this));
	}
}

Page.prototype.show = function (lang, title, body) {
	if (lang) {
		this.title.lang = lang;
		this.body.lang = lang;
	}
	if (title) {
		this.title.textContent = title;
	}
	if (body) {
		this.body.innerHTML = body;
	}
	this.element.hidden = false;
	return this.body;
};

Page.prototype.hide = function () {
	this.element.hidden = true;
};

Page.prototype.isVisible = function () {
	return !this.element.hidden;
};

Page.prototype.getElement = function (cls) {
	if (!this.namedElements[cls]) {
		this.namedElements[cls] = this.body.getElementsByClassName(cls)[0];
	}
	return this.namedElements[cls];
};

Page.prototype.scrollTop = function () {
	this.element.scrollTop = 0;
};

return Page;
})();