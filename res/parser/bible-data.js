/*global bibleData: true*/
bibleData =
(function () {
"use strict";

var BOOKS = [
	//TODO extend data, especially l10n
	{id: 'ot', abbr: {'*': 'OT', 'de': 'AT'}, cls: 'intro'},
	{id: 'gen', title: 'Genesis', z: 1},
	{id: 'exod', title: 'Exodus', abbr: {de: 'Ex'}, z: 2},
	{id: 'lev', title: {'*': 'Leviticus', de: 'Levitikus'}, z: 3},
	{id: 'num', title: {'*': 'Numbers', de: 'Numeri'}, z: 4},
	{id: 'deut', title: {'*': 'Deuteronomy', de: 'Deuteronomium'}, abbr: {de: 'Dtn'}, z: 5},
	{id: 'josh', title: {'*': 'Joshua', de: 'Josua'}, abbr: {de: 'Jos'}, z: 6},
	{id: 'judg', title: {'*': 'Judges', de: 'Richter'}, abbr: {de: 'Ri'}, z: 7},
	{id: 'ruth', title: {'*': 'Ruth', de: 'Rut'}, abbr: {de: 'Rut'}, z: 8},
	{id: '1sam', title: '1 Samuel', abbr: {de: '1. Sam'}, z: 9},
	{id: '2sam', title: '2 Samuel', abbr: {de: '2. Sam'}, z: 10},
	{id: '1kgs', title: '1 Kings', abbr: {de: '1. Kön'}, z: 11},
	{id: '2kgs', title: '2 Kings', abbr: {de: '2. Kön'}, z: 12},
	{id: '1chr', title: '1 Chronicles', abbr: {de: '1. Chr'}, z: 13},
	{id: '2chr', title: '2 Chronicles', abbr: {de: '2. Chr'}, z: 14},
	{id: 'ezra', title: 'Ezra', abbr: {de: 'Esra'}, z: 15},
	{id: 'neh', title: 'Nehemiah', z: 16},
	{id: 'esth', title: 'Esther', abbr: {de: 'Est'}, z: 17},
	{id: 'job', title: 'Job', abbr: {de: 'Ijob'}, z: 18},
	{id: 'ps', title: 'Psalms', z: 19},
	{id: 'prov', title: 'Proverbs', abbr: {de: 'Spr'}, z: 20},
	{id: 'eccl', title: 'Ecclesiastes', abbr: {de: 'Koh'}, z: 21},
	{id: 'song', title: 'Song of Solomon', abbr: {de: 'Hld'}, z: 22},
	{id: 'isa', title: 'Isaiah', abbr: {de: 'Jes'}, z: 23},
	{id: 'jer', title: 'Jeremiah', z: 24},
	{id: 'lam', title: 'Lamentations', abbr: {de: 'Klgl'}, z: 25},
	{id: 'ezek', title: 'Ezekiel', abbr: {de: 'Ez'}, z: 26},
	{id: 'dan', title: 'Daniel', z: 27},
	{id: 'hos', title: 'Hosea', z: 28},
	{id: 'joel', title: 'Joel', z: 29},
	{id: 'amos', title: 'Amos', abbr: {de: 'Am'}, z: 30},
	{id: 'obad', title: 'Obadiah', abbr: {de: 'Obd'}, z: 31},
	{id: 'jonah', title: 'Jonah', abbr: {de: 'Jona'}, z: 32},
	{id: 'mic', title: 'Micah', abbr: {de: 'Mi'}, z: 33},
	{id: 'nah', title: 'Nahum', z: 34},
	{id: 'hab', title: 'Habakkuk', z: 35},
	{id: 'zeph', title: 'Zephaniah', abbr: {de: 'Zef'}, z: 36},
	{id: 'hag', title: 'Haggai', z: 37},
	{id: 'zech', title: 'Zechariah', abbr: {de: 'Sach'}, z: 38},
	{id: 'mal', title: 'Malachi', z: 39},

	{id: 'nt', abbr: 'NT', cls: 'intro'},
	{id: 'matt', title: 'Matthew', abbr: {de: 'Mt'}, z: 40},
	{id: 'mark', title: 'Mark', abbr: {de: 'Mk'}, z: 41},
	{id: 'luke', title: 'Luke', abbr: {de: 'Lk'}, z: 42},
	{id: 'john', title: 'John', abbr: {de: 'Joh'}, z: 43},
	{id: 'acts', title: 'Acts of the Apostles', abbr: {de: 'Apg'}},
	{id: 'rom', abbr: {de: 'Röm'}, z: 45},
	{id: '1cor', abbr: {de: '1. Kor'}, z: 46},
	{id: '2cor', abbr: {de: '2. Kor'}, z: 47},
	{id: 'gal', z: 48},
	{id: 'eph', z: 49},
	{id: 'phil', z: 50},
	{id: 'col', abbr: {de: 'Kol'}, z: 51},
	{id: '1thess', abbr: {de: '1. Thess'}, z: 52},
	{id: '2thess', abbr: {de: '2. Thess'}, z: 53},
	{id: '1tim', abbr: {de: '1. Tim'}, z: 54},
	{id: '2tim', abbr: {de: '2. Tim'}, z: 55},
	{id: 'titus', abbr: {de: 'Tit'}, z: 56},
	{id: 'phlm', z: 57},
	{id: 'heb', z: 58},
	{id: 'jas', abbr: {de: 'Jak'}, z: 59},
	{id: '1pet', abbr: {de: '1. Petr'}, z: 60},
	{id: '2pet', abbr: {de: '2. Petr'}, z: 61},
	{id: '1john', abbr: {de: '1. Joh'}, z: 62},
	{id: '2john', abbr: {de: '2. Joh'}, z: 63},
	{id: '3john', abbr: {de: '3. Joh'}, z: 64},
	{id: 'jude', abbr: {de: 'Jud'}, z: 65},
	{id: 'rev', title: 'Revelation to John', abbr: {de: 'Offb'}, z: 66},

	{id: 'tob', z: 67},
	{id: 'jdt', z: 68},
	//{id: 'esg', z: 69},
	{id: 'addesth', abbr: 'AddEsth', z: 70},
	{id: 'wis', abbr: {de: 'Weish'}, z: 71},
	{id: 'sir', z: 72},
	{id: 'bar', z: 73},
	{id: 'epjer', abbr: 'EpJer', z: 74},
	//{id: 'dag', z: 75}, //adddan, prazar ?
	{id: 'sgtrhee', abbr: 'SgThree', z: 76},
	{id: 'sus', z: 77},
	{id: 'bel', z: 78},
	{id: '1macc', abbr: {de: '1. Makk'}, z: 79},
	{id: '2macc', abbr: {de: '2. Makk'}, z: 80},
	{id: '3macc', abbr: {de: '3. Makk'}, z: 81},
	{id: '4macc', abbr: {de: '4. Makk'}, z: 82},
	{id: 'prman', abbr: 'PrMan', z: 83},
	{id: '1esd', z: 84},
	{id: '2esd', z: 85},
	{id: 'addps', abbr: 'AddPs'}, //z: 86?, 88?
	{id: 'eplao', abbr: 'EpLao'}
	//{id: 'ps2', z: 86},

	//{id: 'oda', z: 87},
	//{id: 'pss', z: 88},

	//{id: 'jsa', z: 89},
	//{id: 'jdb', z: 90},
	//{id: 'tbs', z: 91},
	//{id: 'sst', z: 92},
	//{id: 'dnt', z: 93},
	//{id: 'blt', z: 94}
];

function getAbbrFromId (id) {
	var abbr;
	abbr = id.slice(0, 1).toUpperCase() + id.slice(1);
	if (abbr === id) {
		abbr = id.slice(0, 1) + ' ' + id.slice(1, 2).toUpperCase() + id.slice(2);
	}
	return abbr;
}

function getTitle (data, lang) {
	if (typeof data.title === 'string') {
		return data.title;
	}
	if (data.title) {
		return data.title[lang] || data.title['*'] || getAbbr(data, lang);
	}
	return getAbbr(data, lang);
}

function getAbbr (data, lang) {
	if (typeof data.abbr === 'string') {
		return data.abbr;
	}
	if (data.abbr) {
		return data.abbr[lang] || data.abbr['*'] || getAbbrFromId(data.id);
	}
	return getAbbrFromId(data.id);
}

function prepareData (data, lang) {
	return data && {
		id: data.id,
		title: getTitle(data, lang),
		abbr: getAbbr(data, lang),
		cls: data.cls || ''
	};
}

function findBook (key, val) {
	var i;
	for (i = 0; i < BOOKS.length; i++) {
		if (BOOKS[i][key] === val) {
			return BOOKS[i];
		}
	}
}

function getBookById (id, lang) {
	return prepareData(findBook('id', id), lang);
}

function getBookByZefaniaNumber (z, lang) {
	return prepareData(findBook('z', Number(z)), lang);
}

return {
	getBookById: getBookById,
	getBookByZefaniaNumber: getBookByZefaniaNumber
};

})();