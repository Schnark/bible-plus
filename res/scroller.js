/*global Scroller: true*/
Scroller =
(function () {
"use strict";

//TODO changing the font size or window size or similar changes sometime makes `manageAddRemove` necessary

function Scroller (area) {
	this.area = area;
	this.first = 0;
	this.current = 0;
	this.sections = [];
	this.ignoreScroll = false;
	area.addEventListener('scroll', this.onScroll.bind(this));
}

Scroller.VIEW_THRESHOLD = 50;
Scroller.ADD_THRESHOLD = 100;
Scroller.REMOVE_THRESHOLD = 200;

Scroller.prototype.onScroll = function () {
	var section;
	if (!this.provider || this.ignoreScroll) {
		return;
	}
	section = this.getSection();
	if (this.current !== section) {
		this.current = section;
		this.provider.setSection(section);
	}
	this.manageAddRemove();
};

Scroller.prototype.setProvider = function (provider) {
	this.provider = provider;
};

Scroller.prototype.shouldAddBefore = function () {
	return this.first > 0 && this.area.scrollTop < Scroller.ADD_THRESHOLD;
};

Scroller.prototype.shouldAddAfter = function () {
	return this.first + this.sections.length < this.provider.getSectionCount() &&
		this.area.scrollHeight - this.area.scrollTop - this.area.clientHeight < Scroller.ADD_THRESHOLD;
};

Scroller.prototype.shouldRemoveBefore = function () {
	return this.sections.length > 1 && this.area.scrollTop - this.sections[0].clientHeight > Scroller.REMOVE_THRESHOLD;
};

Scroller.prototype.shouldRemoveAfter = function () {
	return this.sections.length > 1 &&
		this.area.scrollHeight - this.area.scrollTop - this.area.clientHeight -
			this.sections[this.sections.length - 1].clientHeight > Scroller.REMOVE_THRESHOLD;
};

Scroller.prototype.addBefore = function () {
	var scrollTop = this.area.scrollTop;
	this.first--;
	this.sections.unshift(this.provider.getSection(this.first));
	this.area.insertBefore(this.sections[0], this.sections[1]);
	this.area.scrollTop = scrollTop + this.sections[0].clientHeight;
};

Scroller.prototype.addAfter = function () {
	var scrollTop = this.area.scrollTop;
	this.sections.push(this.provider.getSection(this.first + this.sections.length));
	this.area.appendChild(this.sections[this.sections.length - 1]);
	this.area.scrollTop = scrollTop;
};

Scroller.prototype.removeBefore = function () {
	var scrollTop = this.area.scrollTop;
	scrollTop -= this.sections[0].clientHeight;
	this.area.removeChild(this.sections[0]);
	this.first++;
	this.sections.shift();
	this.area.scrollTop = scrollTop;
};

Scroller.prototype.removeAfter = function () {
	var scrollTop = this.area.scrollTop;
	this.area.removeChild(this.sections[this.sections.length - 1]);
	this.sections.pop();
	this.area.scrollTop = scrollTop;
};

Scroller.prototype.manageAddRemove = function () {
	if (!this.area.clientHeight) {
		return;
	}
	/*console.log(
		'[before] first: %d, lenght: %d, scrollTop: %d, scrollHeight: %d, clientHeight: %d',
		this.first, this.sections.length, this.area.scrollTop, this.area.scrollHeight, this.area.clientHeight
	);*/
	while (this.shouldRemoveBefore()) {
		this.removeBefore();
	}
	while (this.shouldRemoveAfter()) {
		this.removeAfter();
	}
	while (this.shouldAddAfter()) {
		this.addAfter();
	}
	while (this.shouldAddBefore()) {
		this.addBefore();
	}
	/*console.log(
		'[after] first: %d, lenght: %d, scrollTop: %d, scrollHeight: %d, clientHeight: %d',
		this.first, this.sections.length, this.area.scrollTop, this.area.scrollHeight, this.area.clientHeight
	);*/
};

Scroller.prototype.setSection = function (index, id, ids) {
	this.ignoreScroll = true;
	this.area.innerHTML = '';
	this.sections = [this.provider.getSection(index)];
	this.first = index;
	this.current = index;
	this.provider.setSection(index);
	this.area.appendChild(this.sections[0]);
	this.area.scrollTop = 0;
	setTimeout(function () {
		var els;
		this.area.scrollTop = 0;
		if (id) {
			ids = ids ? ids.split(' ') : [id];
			els = document.querySelectorAll(ids.map(function (id) {
				return '#' + id + ',[data-idcont="' + id + '"]';
			}).join(','));
			Array.prototype.forEach.call(els, function (el) {
				el.classList.add('highlight-temp');
			});
			document.getElementById(id).scrollIntoView();
		}
		this.manageAddRemove();
		this.ignoreScroll = false;
	}.bind(this), 0);
};

Scroller.prototype.updateSection = function (index) {
	var section, scrollTop;
	if (index < this.first || this.first + this.sections.length - 1 < index) {
		return;
	}
	section = this.provider.getSection(index);
	this.ignoreScroll = true;
	scrollTop = this.area.scrollTop;
	this.area.replaceChild(section, this.sections[index - this.first]);
	this.sections[index - this.first] = section;
	this.area.scrollTop = scrollTop;
	this.ignoreScroll = false;
};

Scroller.prototype.getSection = function () {
	var i, h = this.area.scrollTop + Scroller.VIEW_THRESHOLD;
	for (i = 0; i < this.sections.length; i++) {
		h -= this.sections[i].clientHeight;
		if (h < 0) {
			return this.first + i;
		}
	}
};

return Scroller;
})();