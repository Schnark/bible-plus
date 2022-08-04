/*global bibleData: true*/
bibleData =
(function () {
"use strict";

var BOOKS = {
	//TODO extend data, especially l10n
	ot: [
		{id: 'ot', abbr: {'*': 'OT', 'de': 'AT'}, cls: 'intro'},
		{id: 'gen', title: 'Genesis', z: 1, chapters: [
			31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21,
			16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43,
			55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28,
			34, 31, 22, 33, 26
		]},
		{id: 'exod', title: 'Exodus', abbr: {de: 'Ex'}, z: 2, chapters: [
			22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27,
			36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38,
			18, 35, 23, 35, 35, 38, 29, 31, 43, 38
		]},
		{id: 'lev', title: {'*': 'Leviticus', de: 'Levitikus'}, z: 3, chapters: [
			17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33,
			34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34
		]},
		{id: 'num', title: {'*': 'Numbers', de: 'Numeri'}, z: 4, chapters: [
			54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41,
			50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16,
			54, 42, 56, 29, 34, 13
		]},
		{id: 'deut', title: {'*': 'Deuteronomy', de: 'Deuteronomium'}, abbr: {de: 'Dtn'}, z: 5, chapters: [
			46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23,
			22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20,
			30, 52, 29, 12
		]},
		{id: 'josh', title: {'*': 'Joshua', de: 'Josua'}, abbr: {de: 'Jos'}, z: 6, chapters: [
			18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63,
			10, 18, 28, 51, 9, 45, 34, 16, 33
		]},
		{id: 'judg', title: {'*': 'Judges', de: 'Richter'}, abbr: {de: 'Ri'}, z: 7, chapters: [
			36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20,
			31, 13, 31, 30, 48, 25
		]},
		{id: 'ruth', title: {'*': 'Ruth', de: 'Rut'}, abbr: {de: 'Rut'}, z: 8, chapters: [22, 23, 18, 22]},
		{id: '1sam', title: '1 Samuel', abbr: {de: '1. Sam'}, z: 9, chapters: [
			28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35,
			23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31,
			13
		]},
		{id: '2sam', title: '2 Samuel', abbr: {de: '2. Sam'}, z: 10, chapters: [
			27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37,
			23, 29, 33, 43, 26, 22, 51, 39, 25
		]},
		{id: '1kgs', title: '1 Kings', abbr: {de: '1. Kön'}, z: 11, chapters: [
			53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34,
			34, 24, 46, 21, 43, 29, 53
		]},
		{id: '2kgs', title: '2 Kings', abbr: {de: '2. Kön'}, z: 12, chapters: [
			18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38,
			20, 41, 37, 37, 21, 26, 20, 37, 20, 30
		]},
		{id: '1chr', title: '1 Chronicles', abbr: {de: '1. Chr'}, z: 13, chapters: [
			54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29,
			43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30
		]},
		{id: '2chr', title: '2 Chronicles', abbr: {de: '2. Chr'}, z: 14, chapters: [
			17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19,
			14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27,
			21, 33, 25, 33, 27, 23
		]},
		{id: 'ezra', title: 'Ezra', abbr: {de: 'Esra'}, z: 15, chapters: [11, 70, 13, 24, 17, 22, 28, 36, 15, 44]},
		{id: 'neh', title: 'Nehemiah', z: 16, chapters: [
			11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31
		]},
		{id: 'esth', title: 'Esther', abbr: {de: 'Est'}, z: 17, chapters: [22, 23, 15, 17, 14, 14, 10, 17, 32, 3]},
		{id: 'job', title: 'Job', abbr: {de: 'Ijob'}, z: 18, chapters: [
			22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35,
			22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31,
			40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17
		]},
		{id: 'ps', title: 'Psalms', z: 19, chapters: [
			6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15,
			50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22,
			22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20,
			23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13,
			20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16,
			8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12,
			9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8,
			18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18,
			3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14,
			9, 6
		]},
		{id: 'prov', title: 'Proverbs', abbr: {de: 'Spr'}, z: 20, chapters: [
			33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33,
			33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33,
			31
		]},
		{id: 'eccl', title: 'Ecclesiastes', abbr: {de: 'Koh'}, z: 21, chapters: [
			18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14
		]},
		{id: 'song', title: 'Song of Solomon', abbr: {de: 'Hld'}, z: 22, chapters: [17, 17, 11, 16, 16, 13, 13, 14]},
		{id: 'isa', title: 'Isaiah', abbr: {de: 'Jes'}, z: 23, chapters: [
			31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9,
			14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33,
			9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25,
			13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22,
			11, 12, 19, 12, 25, 24
		]},
		{id: 'jer', title: 'Jeremiah', z: 24, chapters: [
			19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21,
			21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24,
			40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5,
			28, 7, 47, 39, 46, 64, 34
		]},
		{id: 'lam', title: 'Lamentations', abbr: {de: 'Klgl'}, z: 25, chapters: [22, 22, 66, 22, 22]},
		{id: 'ezek', title: 'Ezekiel', abbr: {de: 'Ez'}, z: 26, chapters: [
			28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8,
			63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26,
			18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25,
			24, 23, 35
		]},
		{id: 'dan', title: 'Daniel', z: 27, chapters: [
			21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13
		]},
		{id: 'hos', title: 'Hosea', z: 28, chapters: [
			11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9
		]},
		{id: 'joel', title: 'Joel', z: 29, chapters: [20, 32, 21]},
		{id: 'amos', title: 'Amos', abbr: {de: 'Am'}, z: 30, chapters: [15, 16, 15, 13, 27, 14, 17, 14, 15]},
		{id: 'obad', title: 'Obadiah', abbr: {de: 'Obd'}, z: 31, chapters: [21]},
		{id: 'jonah', title: 'Jonah', abbr: {de: 'Jona'}, z: 32, chapters: [17, 10, 10, 11]},
		{id: 'mic', title: 'Micah', abbr: {de: 'Mi'}, z: 33, chapters: [16, 13, 12, 13, 15, 16, 20]},
		{id: 'nah', title: 'Nahum', z: 34, chapters: [15, 13, 19]},
		{id: 'hab', title: 'Habakkuk', z: 35, chapters: [17, 20, 19]},
		{id: 'zeph', title: 'Zephaniah', abbr: {de: 'Zef'}, z: 36, chapters: [18, 15, 20]},
		{id: 'hag', title: 'Haggai', z: 37, chapters: [15, 23]},
		{id: 'zech', title: 'Zechariah', abbr: {de: 'Sach'}, z: 38, chapters: [
			21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21
		]},
		{id: 'mal', title: 'Malachi', z: 39, chapters: [14, 17, 18, 6]}
	],
	nt: [
		{id: 'nt', abbr: 'NT', cls: 'intro'},
		{id: 'matt', title: 'Matthew', abbr: {de: 'Mt'}, z: 40, chapters: [
			25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39,
			28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20
		]},
		{id: 'mark', title: 'Mark', abbr: {de: 'Mk'}, z: 41, chapters: [
			45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47,
			20
		]},
		{id: 'luke', title: 'Luke', abbr: {de: 'Lk'}, z: 42, chapters: [
			80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32,
			31, 37, 43, 48, 47, 38, 71, 56, 53
		]},
		{id: 'john', title: 'John', abbr: {de: 'Joh'}, z: 43, chapters: [
			51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27,
			33, 26, 40, 42, 31, 25
		]},
		{id: 'acts', title: 'Acts of the Apostles', abbr: {de: 'Apg'}, z: 44, chapters: [
			26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41,
			40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31
		]},
		{id: 'rom', abbr: {de: 'Röm'}, z: 45, chapters: [
			32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33,
			27
		]},
		{id: '1cor', abbr: {de: '1. Kor'}, z: 46, chapters: [
			31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58,
			24
		]},
		{id: '2cor', abbr: {de: '2. Kor'}, z: 47, chapters: [
			24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14
		]},
		{id: 'gal', z: 48, chapters: [24, 21, 29, 31, 26, 18]},
		{id: 'eph', z: 49, chapters: [23, 22, 21, 32, 33, 24]},
		{id: 'phil', z: 50, chapters: [30, 30, 21, 23]},
		{id: 'col', abbr: {de: 'Kol'}, z: 51, chapters: [29, 23, 25, 18]},
		{id: '1thess', abbr: {de: '1. Thess'}, z: 52, chapters: [10, 20, 13, 18, 28]},
		{id: '2thess', abbr: {de: '2. Thess'}, z: 53, chapters: [12, 17, 18]},
		{id: '1tim', abbr: {de: '1. Tim'}, z: 54, chapters: [20, 15, 16, 16, 25, 21]},
		{id: '2tim', abbr: {de: '2. Tim'}, z: 55, chapters: [18, 26, 17, 22]},
		{id: 'titus', abbr: {de: 'Tit'}, z: 56, chapters: [16, 15, 15]},
		{id: 'phlm', z: 57, chapters: [25]},
		{id: 'heb', z: 58, chapters: [
			14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25
		]},
		{id: 'jas', abbr: {de: 'Jak'}, z: 59, chapters: [27, 26, 18, 17, 20]},
		{id: '1pet', abbr: {de: '1. Petr'}, z: 60, chapters: [25, 25, 22, 19, 14]},
		{id: '2pet', abbr: {de: '2. Petr'}, z: 61, chapters: [21, 22, 18]},
		{id: '1john', abbr: {de: '1. Joh'}, z: 62, chapters: [10, 29, 24, 21, 21]},
		{id: '2john', abbr: {de: '2. Joh'}, z: 63, chapters: [13]},
		{id: '3john', abbr: {de: '3. Joh'}, z: 64, chapters: [14]},
		{id: 'jude', abbr: {de: 'Jud'}, z: 65, chapters: [25]},
		{id: 'rev', title: 'Revelation to John', abbr: {de: 'Offb'}, z: 66, chapters: [
			20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8,
			21, 18, 24, 21, 15, 27, 21
		]}
	],
	other: [
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
		{id: '2esd', z: 85}
		//{id: 'ps2', z: 86},

		//{id: 'oda', z: 87},
		//{id: 'pss', z: 88},

		//{id: 'jsa', z: 89},
		//{id: 'jdb', z: 90},
		//{id: 'tbs', z: 91},
		//{id: 'sst', z: 92},
		//{id: 'dnt', z: 93},
		//{id: 'blt', z: 94}
	]
};

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
		cls: data.cls || '',
		chapters: data.chapters || [0]
	};
}

function findBook (key, val) {
	return findBookInGroup('ot', key, val) ||
		findBookInGroup('nt', key, val) ||
		findBookInGroup('other', key, val);
}

function findBookInGroup (group, key, val) {
	var i;
	for (i = 0; i < BOOKS[group].length; i++) {
		if (BOOKS[group][i][key] === val) {
			return BOOKS[group][i];
		}
	}
}

function getBookById (id, lang) {
	return prepareData(findBook('id', id), lang);
}

function getBookByZefaniaNumber (z, lang) {
	return prepareData(findBook('z', Number(z)), lang);
}

function getBooksBySwordGroup (group, lang) {
	return BOOKS[group].map(function (book) {
		return prepareData(book, lang);
	});
}

return {
	getBookById: getBookById,
	getBookByZefaniaNumber: getBookByZefaniaNumber,
	getBooksBySwordGroup: getBooksBySwordGroup
};

})();