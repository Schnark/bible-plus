/*global util, bibleData, BibleBuilder, GenericHtmlConverter*/
(function () {
"use strict";

function VaticanBibleHtmlConverter () {
}

VaticanBibleHtmlConverter.urlToId = {};
VaticanBibleHtmlConverter.idToUrlPart = {
	gen: 'vt_genesis',
	exod: 'vt_exodus',
	lev: 'vt_leviticus',
	num: 'vt_numeri',
	deut: 'vt_deuteronomii',
	josh: 'vt_iosue',
	judg: 'vt_iudicum',
	ruth: 'vt_ruth',
	'1sam': 'vt_i-samuelis',
	'2sam': 'vt_ii-samuelis',
	'1kgs': 'vt_i-regum',
	'2kgs': 'vt_ii-regum',
	'1chr': 'vt_i-paralipomenon',
	'2chr': 'vt_ii-paralipomenon',
	ezra: 'vt_esdrae',
	neh: 'vt_nehemiae',
	tob: 'vt_thobis',
	jdt: 'vt_iudith',
	esth: 'vt_esther',
	job: 'vt_iob',
	ps: 'vt_psalmorum',
	prov: 'vt_proverbiorum',
	eccl: 'vt_ecclesiastes',
	song: 'vt_canticum-canticorum',
	wis: 'vt_sapientiae',
	sir: 'vt_ecclesiasticus',
	isa: 'vt_isaiae',
	jer: 'vt_ieremiae',
	lam: 'vt_lamentationes',
	bar: 'vt_baruch',
	ezek: 'vt_ezechielis',
	dan: 'vt_danielis',
	hos: 'vt_osee',
	joel: 'vt_ioel',
	amos: 'vt_amos',
	obad: 'vt_abdiae',
	jonah: 'vt_ionae',
	mic: 'vt_michaeae',
	nah: 'vt_nahum',
	hab: 'vt_habacuc',
	zeph: 'vt_sophoniae',
	hag: 'vt_aggaei',
	zech: 'vt_zachariae',
	mal: 'vt_malachiae',
	'1macc': 'vt_i-maccabaeorum',
	'2macc': 'vt_ii-maccabaeorum',
	matt: 'nt_evang-matthaeum',
	mark: 'nt_evang-marcum',
	luke: 'nt_evang-lucam',
	john: 'nt_evang-ioannem',
	acts: 'nt_actus-apostolorum',
	rom: 'nt_epist-romanos',
	'1cor': 'nt_epist-i-corinthios',
	'2cor': 'nt_epist-ii-corinthios',
	gal: 'nt_epist-galatas',
	eph: 'nt_epist-ephesios',
	phil: 'nt_epist-philippenses',
	col: 'nt_epist-colossenses',
	'1thess': 'nt_epist-i-thessalonicenses',
	'2thess': 'nt_epist-ii-thessalonicenses',
	'1tim': 'nt_epist-i-timotheum',
	'2tim': 'nt_epist-ii-timotheum',
	titus: 'nt_epist-titum',
	phlm: 'nt_epist-philemonem',
	heb: 'nt_epist-hebraeos',
	jas: 'nt_epist-iacobi',
	'1pet': 'nt_epist-i-petri',
	'2pet': 'nt_epist-ii-petri',
	'1john': 'nt_epist-i-ioannis',
	'2john': 'nt_epist-ii-ioannis',
	'3john': 'nt_epist-iii-ioannis',
	jude: 'nt_epist-iudae',
	rev: 'nt_apocalypsis-ioannis'
};

VaticanBibleHtmlConverter.getUrl = function (id) {
	var url;
	url = 'https://www.vatican.va/archive/bible/nova_vulgata/documents/nova-vulgata_' +
		(VaticanBibleHtmlConverter.idToUrlPart[id] || id) +
		'_lt.html';
	VaticanBibleHtmlConverter.urlToId[url] = id;
	return url;
};

VaticanBibleHtmlConverter.getIds = function () {
	return Object.keys(VaticanBibleHtmlConverter.idToUrlPart);
};

VaticanBibleHtmlConverter.prototype = new GenericHtmlConverter();

VaticanBibleHtmlConverter.prototype.getMetadata = function (doc, data) {
	function wordCase (str) {
		return str.split(' ').map(function (word) {
			return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
		}).join(' ');
	}

	var title = doc.title, id;
	id = VaticanBibleHtmlConverter.urlToId[data.url] || 'debug';
	return {
		id: id,
		lang: 'la',
		title: wordCase(title.replace(/ - .*/, '')),
		abbr: bibleData.getBookById(id, 'la').abbr
	};
};

VaticanBibleHtmlConverter.prototype.getBookBuilderConstructor = function () {
	return BibleBuilder;
};

VaticanBibleHtmlConverter.prototype.addP = function (html) {
	var section;
	html = html.replace(/&nbsp;/g, ' ');
	section = /^(?:\s*<[^\/>][^>]*>)*\s*<a name="(?:PSALMUS )?(\d+)">.*?<\/a>(?:\s*<\/[^>]+>)*\s*/.exec(html);
	if (!section && (/<br(?: ?\/)?>\s*2\b/.test(html))) {
		section = ['', '1'];
	}
	if (!section) {
		return;
	}
	this.book.section(section[1]);
	html = html.slice(section[0].length)
		.replace(/<\/?font\b[^>]*>/g, '')
		.split(/<br(?: ?\/)?>/);
	html.forEach(function (line) {
		line = line.trim();
		if (!line) {
			return;
		}
		if (line.charAt(0) >= '1' && line.charAt(0) <= '9') {
			this.book.verse(line.slice(0, line.indexOf(' ')));
			line = line.slice(line.indexOf(' ')).trim();
		} else {
			this.book.inline('<br>\n');
		}
		this.book.inline(line);
	}, this);
};

VaticanBibleHtmlConverter.prototype.convertDoc = function (doc) {
	var p = doc.getElementsByTagName('p'), i;
	for (i = 0; i < p.length; i++) {
		this.addP(p[i].innerHTML);
	}
};

util.converters.vaticanbible = VaticanBibleHtmlConverter;
util.converters['vaticanbible-debug'] = VaticanBibleHtmlConverter;

})();