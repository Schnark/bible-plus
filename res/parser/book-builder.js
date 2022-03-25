/*global AbstractBookBuilder: true, BibleBuilder: true, BookBuilder: true*/
/*global util*/
AbstractBookBuilder =
(function () {
"use strict";

function AbstractBookBuilder () {
}

AbstractBookBuilder.prototype.init = function (data) {
	this.data = data;
	this.html = [];
	this.tags = {};
	this.state = 0;
	this.trimStart = true;
};

AbstractBookBuilder.prototype.trim = function (str) {
	if (!this.trimStart) {
		return str;
	}
	this.trimStart = false;
	return str.replace(/^\s+/, '');
};

AbstractBookBuilder.prototype.setTags = function (type, tags) {
	this.tags[type] = Array.isArray(tags) ? tags : [tags];
};

AbstractBookBuilder.prototype.add = function (type) {
	var tags = this.tags[type] || [''],
		tag = tags[0];
	if (tags.length > 1) {
		this.tags[type].shift();
	}
	if (this.html.length) {
		this.html[this.html.length - 1] = this.html[this.html.length - 1].replace(/ +$/, '');
	}
	this.trimStart = true;
	this.html.push(tag);
};

AbstractBookBuilder.prototype.getAbbr = function (abbr, type) {
	if (type === 'section') {
		return abbr + ' %s';
	}
	return abbr + ' %s, %v';
};

AbstractBookBuilder.prototype.getArticleTag = function () {
	return util.openTag('article', {
		id: this.data.id,
		lang: this.data.lang,
		title: this.data.title,
		'class': this.data.cls,
		'data-abbr': this.data.abbr,
		'data-abbr-section': this.data.abbrSection || this.getAbbr(this.data.abbr, 'section'),
		'data-abbr-verse': this.data.abbrVerse || this.getAbbr(this.data.abbr, 'verse'),
		'data-desc': this.data.desc
	}) + '\n';
};

AbstractBookBuilder.prototype.getHTML = function (noWrap) {
	var html;
	this.moveToState(0);
	html = this.html.join('').trim();
	return !noWrap && html ? this.getArticleTag() + html + '\n</article>' : html;
};

AbstractBookBuilder.prototype.block = function (html) {
	var state;
	if (html) {
		html = html.trim();
		if (!html) {
			return;
		}
	}
	if (html.slice(0, 2) === '<h') {
		state = Math.min(this.states.block, this.states.verse - 1);
	} else {
		state = this.states.block;
	}
	this.moveToState(state);
	this.html.push(html + '\n');
};

AbstractBookBuilder.prototype.inline = function (html) {
	if (html) {
		html = this.trim(html);
		if (!html) {
			this.trimStart = true;
			return;
		}
	}
	this.moveToState(this.states.inline);
	this.html.push(html);
};

AbstractBookBuilder.prototype.paragraph = function () {
	this.moveToState(this.states.block);
};

return AbstractBookBuilder;
})();

BibleBuilder =
(function () {
"use strict";

function BibleBuilder (data) {
	this.init(data);
	this.introAbbr = BibleBuilder.introAbbr[data.lang] || 'I';
	this.states = {
		block: 1,
		inline: 3,
		verse: 3
	};
}

BibleBuilder.introAbbr = {
	de: 'E'
};

BibleBuilder.verseAbbr = {
	en: ' %s:%v'
};

BibleBuilder.prototype = new AbstractBookBuilder();

BibleBuilder.prototype.getAbbr = function (abbr, type) {
	if (type === 'section') {
		return abbr + ' %s';
	}
	return abbr + (BibleBuilder.verseAbbr[this.data.lang] || ' %s, %v');
};

BibleBuilder.prototype.moveToState = function (state) {
	//state meaning
	//0     no <section>
	//1     <section>, but no <p>
	//2     <p>, but no verse
	//3     verse
	while (this.state < state) {
		switch (this.state) {
		case 0: this.add('openSection'); break;
		case 1: this.add('openP'); break;
		case 2: this.add('openVerse');
		}
		this.state++;
	}
	while (this.state > state) {
		this.state--;
		switch (this.state) {
		case 0: this.add('closeSection'); break;
		case 1: this.add('closeP'); break;
		case 2: this.add('closeVerse');
		}
	}
};

BibleBuilder.prototype.section = function (n) {
	var attr;
	this.moveToState(0);
	attr = {'data-abbr': n || this.introAbbr};
	if (!n) {
		attr['class'] = 'intro';
	}
	this.setTags('openSection', util.openTag('section', attr));
	this.setTags('closeSection', '</section>\n');
	this.setTags('openP', n ? ['<p><span class="id-big">' + n + '&nbsp;</span>', '<p>'] : '<p>');
	this.setTags('closeP', '</p>\n');
	this.setTags('openVerse', '');
	this.setTags('closeVerse', '');
	this.idPrefix = n ? this.data.id + '-' + n + '-' : '';
};

BibleBuilder.prototype.verse = function (n) {
	if (this.state === this.states.verse) {
		this.moveToState(this.states.verse - 1);
	}
	this.setTags('openVerse', n && this.idPrefix ? [
		util.openTag('span', {id: this.idPrefix + n}) + '<span class="id">' + n + '&nbsp;</span>',
		util.openTag('span', {'data-idcont': this.idPrefix + n})
	] : '');
	this.setTags('closeVerse', n && this.idPrefix ? '</span>\n' : '');
};

return BibleBuilder;
})();

BookBuilder =
(function () {
"use strict";

function BookBuilder (data) {
	this.init(data);
	this.states = {
		block: 2,
		inline: 3,
		verse: 2
	};
}

BookBuilder.prototype = new AbstractBookBuilder();

BookBuilder.prototype.getAbbr = function (abbr, type) {
	if (type === 'section') {
		return abbr + ' %s';
	}
	return abbr + ' %v';
};

BookBuilder.prototype.moveToState = function (state) {
	//state meaning
	//0     no <section>
	//1     <section>, but no verse
	//2     verse, but no <p>
	//3     <p>
	while (this.state < state) {
		switch (this.state) {
		case 0: this.add('openSection'); break;
		case 1: this.add('openVerse'); break;
		case 2: this.add('openP');
		}
		this.state++;
	}
	while (this.state > state) {
		this.state--;
		switch (this.state) {
		case 0: this.add('closeSection'); break;
		case 1: this.add('closeVerse'); break;
		case 2: this.add('closeP');
		}
	}
};

BookBuilder.prototype.section = function (s) {
	this.moveToState(0);
	this.setTags('openSection', util.openTag('section', {'data-abbr': s}));
	this.setTags('closeSection', '</section>\n');
	this.setTags('openP', '<p>');
	this.setTags('closeP', '</p>\n');
	this.setTags('openVerse', '');
	this.setTags('closeVerse', '');
};

BookBuilder.prototype.verse = function (n) {
	if (this.state >= this.states.verse) {
		this.moveToState(this.states.verse - 1);
	}
	this.setTags('openVerse', n ? [
		util.openTag('div', {id: this.data.id + '-' + n}),
		util.openTag('div', {'data-idcont': this.data.id + '-' + n})
	] : '');
	this.setTags('closeVerse', n ? '</div>\n' : '');
	this.setTags('openP', n ? ['<p><span class="id">' + n + '.&nbsp;</span>', '<p>'] : '<p>');
	this.setTags('closeP', '</p>\n');
};

return BookBuilder;
})();