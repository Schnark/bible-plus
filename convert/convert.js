/*global util*/
/*global Promise, alert, console*/
(function () {
"use strict";

var data = {structure: ''}, books = {};

function updatePage () {
	document.getElementById('collection-title').value = data.title || '';
	document.getElementById('collection-lang').value = data.lang || '';
	document.getElementById('collection-type').value = data.type || '';
	document.getElementById('collection-abbr').value = data.abbr || '';
	document.getElementById('collection-sort').value = data.sort || '';
	document.getElementById('collection-desc').value = data.desc || '';
	document.getElementById('structure').value = data.structure;
	onChange({target: document.getElementById('structure')});
}

function parseStructure (list) {
	var structure = [],
		indent = -1,
		lines = list.split('\n'),
		i, line, spaces, label, j;

	if (list === '') {
		return [];
	}

	for (i = 0; i < lines.length; i++) {
		line = lines[i];
		label = line.replace(/^ +/, '');
		spaces = line.length - label.length;
		if (!label) {
			throw new Error('No label in line ' + (i + 1));
		}
		if (spaces > indent + 1) {
			throw new Error('Wrong indention in line ' + (i + 1));
		}
		if (spaces <= indent) {
			structure[structure.length - 1].type = 'leaf';
		}
		for (j = spaces; j < indent; j++) {
			structure.push({type: 'end'});
		}
		structure.push({type: 'start', label: label});
		indent = spaces;
	}
	structure[structure.length - 1].type = 'leaf';
	for (j = 0; j < indent; j++) {
		structure.push({type: 'end'});
	}

	return structure;
}

/*
function diff (a, b) {
	while (a.charAt(0) === b.charAt(0)) {
		a = a.slice(1);
		b = b.slice(1);
	}
	while (a.charAt(a.length - 1) === b.charAt(b.length - 1)) {
		a = a.slice(0, -1);
		b = b.slice(0, -1);
	}
	return a + ' – ' + b;
}

function normalize (html) {
	return html
		.replace(/"([^"]+)"/g, function (all, attr) {
				return '"' + attr.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '"';
		});
}
*/

function addHtmlBook (id, html) {
	var div, article;
	div = document.createElement('div');
	div.innerHTML = html;
	article = div.getElementsByTagName('article')[0];
	books[id] = {
		id: article.id,
		title: article.title,
		lang: article.lang || '',
		abbr: article.dataset.abbr || '',
		abbrSection: article.dataset.abbrSection || '',
		abbrVerse: article.dataset.abbrVerse || '',
		desc: article.dataset.desc || '',
		cls: article.className || '',
		html: article.innerHTML.trim()
	};
	/*if (
		normalize(html.replace(/ lang="[^"]+"/, '')) !==
		normalize(formatBook(id))
	) {
		console.warn(
			'HTML not normalized for ' + article.id,
			diff(
				normalize(html.replace(/ lang="[^"]+"/, '')),
				normalize(formatBook(id))
			)
		);
	}*/
}

function loadCollection (collection, merge) {
	var indent = '', structure = merge && data.structure ? [data.structure] : [];
	data.title = collection.data.title;
	data.lang = collection.data.lang;
	data.type = collection.data.type;
	data.abbr = collection.data.abbr;
	data.sort = collection.data.sort;
	data.desc = collection.data.desc;
	if (!merge) {
		books = {};
	}
	collection.data.books.forEach(function (book) {
		if (book.id) {
			addHtmlBook(book.title, collection.books[book.id]);
			structure.push(indent + book.title);
		} else if (book.label) {
			structure.push(indent + book.label);
			indent += ' ';
		} else {
			indent = indent.slice(1);
		}
	});
	data.structure = structure.join('\n');
	updatePage();
}

function formatBook (title) {
	var book = books[title];
	if (!book) {
		return false;
	}
	return util.openTag('article', {
		id: book.id,
		lang: data.lang === book.lang ? false : book.lang,
		title: book.title,
		'class': book.cls,
		'data-abbr': book.abbr,
		'data-abbr-section': book.abbrSection,
		'data-abbr-verse': book.abbrVerse,
		'data-desc': book.desc
	}) + '\n' + book.html.trim() + '\n</article>';
}

function formatCollection () {
	var html = [];
	html.push();
	html = parseStructure(data.structure).map(function (element) {
		switch (element.type) {
		case 'start':
			return util.openTag('div', {title: element.label});
		case 'leaf':
			return formatBook(element.label) || util.openTag('div', {title: element.label}) + '</div>';
		case 'end':
			return '</div>';
		}
	});
	html.unshift(
		'<!DOCTYPE html>',
		util.openTag('html', {lang: data.lang}),
		'<head>',
		'<meta charset="utf-8">',
		'<title>' + util.htmlEscape(data.title) + '</title>',
		'</head>',
		util.openTag('body', {
			'data-type': data.type,
			'data-abbr': data.abbr,
			'data-sort': data.sort,
			'data-desc': data.desc
		})
	);
	html.push(
		'</body>',
		'</html>'
	);

	return html.join('\n');
}

//TODO auslagern
function buildStructure (collection) {
	if (collection === 'vaticanbible') {
		return util.converters.vaticanbible.getIds().join('\n');
	}
	return [
		collection + ':Gen:50',
		collection + ':Ex:40',
		collection + ':Lev:27',
		collection + ':Num:36',
		collection + ':Dtn:34',
		collection + ':Jos:24',
		collection + ':Ri:21',
		collection + ':Rut:4',
		collection + ':1.Sam:31',
		collection + ':2.Sam:24',
		collection + ':1.Kön:22',
		collection + ':2.Kön:25',
		collection + ':1.Chr:29',
		collection + ':2.Chr:36',
		collection + ':Esra:10',
		collection + ':Neh:13',
		collection + ':Tob:14',
		collection + ':Jdt:16',
		collection + ':Est:10',
		collection + ':1.Makk:16',
		collection + ':2.Makk:15',
		collection + ':Ijob:42',
		collection + ':Ps:150',
		collection + ':Spr:31',
		collection + ':Koh:12',
		collection + ':Hld:8',
		collection + ':Weish:19',
		collection + ':Sir:51',
		collection + ':Jes:66',
		collection + ':Jer:52',
		collection + ':Klgl:5',
		collection + ':Bar:6',
		collection + ':Ez:48',
		collection + ':Dan:14',
		collection + ':Hos:14',
		collection + ':Joel:4',
		collection + ':Am:9',
		collection + ':Obd:1',
		collection + ':Jona:4',
		collection + ':Mi:7',
		collection + ':Nah:3',
		collection + ':Hab:3',
		collection + ':Zef:3',
		collection + ':Hag:2',
		collection + ':Sach:14',
		collection + ':Mal:3',
		collection + ':Mt:28',
		collection + ':Mk:16',
		collection + ':Lk:24',
		collection + ':Joh:21',
		collection + ':Apg:28',
		collection + ':Röm:16',
		collection + ':1.Kor:16',
		collection + ':2.Kor:13',
		collection + ':Gal:6',
		collection + ':Eph:6',
		collection + ':Phil:4',
		collection + ':Kol:4',
		collection + ':1.Thess:5',
		collection + ':2.Thess:3',
		collection + ':1.Tim:6',
		collection + ':2.Tim:4',
		collection + ':Tit:3',
		collection + ':Phlm:1',
		collection + ':Hebr:13',
		collection + ':Jak:5',
		collection + ':1.Petr:5',
		collection + ':2.Petr:3',
		collection + ':1.Joh:5',
		collection + ':2.Joh:1',
		collection + ':3.Joh:1',
		collection + ':Jud:1',
		collection + ':Offb:22'
	].join('\n');
}

function generateStructure (collection, merge) {
	var structure = '';
	if (merge && data.structure.trim()) {
		structure = data.structure.trim() + '\n';
	}
	structure += buildStructure(collection);
	data.structure = structure;
	updatePage();
}

function scrapBooks (type) {
	return Promise.all(
		parseStructure(data.structure).filter(function (element) {
			return element.type === 'leaf';
		}).map(function (element) {
			return element.label;
		}).map(function (id) {
			if (!books[id] || !books[id].html) {
				return util.scrap(type, id).then(function (book) {
					addHtmlBook(id, book.html);
					updatePage();
				});
			}
		})
	);
}

function checkBook (html, data) {
	return util.checkers.map(function (checker) {
		return checker(html, data);
	}).filter(function (warning) {
		return warning;
	}).join('\n');
}

function checkBooks () {
	return parseStructure(data.structure).filter(function (element) {
		return element.type === 'leaf';
	}).map(function (element) {
		return element.label;
	}).filter(function (book) {
		return books[book] && books[book].html;
	}).map(function (book) {
		var warning = checkBook(books[book].html, books[book]);
		books[book].warning = warning;
		return warning && book;
	}).filter(function (book) {
		return book;
	});
}

function showStructure (html, depth) {
	var div = document.createElement('div'), result = [], indentStr = '';

	function add (str) {
		if (indentStr.length < depth) {
			result.push(indentStr + str);
		}
	}

	function indent () {
		indentStr += ' ';
	}

	function outdent () {
		indentStr = indentStr.slice(1);
	}

	div.innerHTML = html;
	div.id = 'ignore';
	util.walkElement(div, function (tag, attr, el) {
		if (!tag && attr.trim()) {
			add('{text}');
		} else if (!tag) {
			return;
		} else if (tag === 'section' && attr) {
			add('<section> (' + attr['data-abbr'] + ')');
			indent();
			return true;
		} else if (tag === 'section') {
			outdent();
		} else if (/^h\d$/.test(tag)) {
			add('<' + tag + '> (' + el.textContent + ')');
		} else if (tag === 'div' && attr && attr.id === 'ignore') {
			return true;
		} else if (attr && attr.id) {
			add('[' + attr.id + ']');
		} else if (attr && attr['data-idcont']) {
			add('[' + attr['data-idcont'] + '] (cont.)');
		} else if (attr) {
			add('<' + tag + '>');
			indent();
			return true;
		} else {
			outdent();
		}
	}, true);
	return result.join('\n');
}

function onChange (e) {
	var id = e.target.id, val = e.target.value, bookName = document.getElementById('book-name').value, book;
	switch (id) {
	case 'collection-title':
		data.title = val;
		break;
	case 'collection-lang':
		data.lang = val;
		break;
	case 'collection-type':
		data.type = val;
		break;
	case 'collection-abbr':
		data.abbr = val;
		break;
	case 'collection-sort':
		data.sort = val;
		break;
	case 'collection-desc':
		data.desc = val;
		break;
	case 'structure':
		book = document.getElementById('book-name').value;
		try {
			document.getElementById('book-name').innerHTML = parseStructure(val).filter(function (element) {
				return element.type === 'leaf';
			}).map(function (element) {
				return '<option' + (element.label === book ? ' selected' : '') + '>' +
					util.htmlEscape(element.label) + '</option>';
			}).join('');
			data.structure = val;
		} catch (e) {
			alert(e);
			break;
		}
		val = document.getElementById('book-name').value;
		/* falls through */
	case 'book-name':
		if (!books[val]) {
			books[val] = {};
		}
		document.getElementById('book-id').value = books[val].id || '';
		document.getElementById('book-title').value = books[val].title || val;
		document.getElementById('book-lang').value = books[val].lang || '';
		document.getElementById('book-abbr').value = books[val].abbr || '';
		document.getElementById('book-abbr-section').value = books[val].abbrSection || '';
		document.getElementById('book-abbr-verse').value = books[val].abbrVerse || '';
		document.getElementById('book-desc').value = books[val].desc || '';
		document.getElementById('book-cls').value = books[val].cls || '';
		document.getElementById('book-html').value = books[val].html || '';
		document.getElementById('book-warning').innerHTML = books[val].warning || '';
		break;
	case 'book-id':
		books[bookName].id = val;
		break;
	case 'book-title':
		books[bookName].title = val;
		break;
	case 'book-lang':
		books[bookName].lang = val;
		break;
	case 'book-abbr':
		books[bookName].abbr = val;
		break;
	case 'book-abbr-section':
		books[bookName].abbrSection = val;
		break;
	case 'book-abbr-verse':
		books[bookName].abbrVerse = val;
		break;
	case 'book-desc':
		books[bookName].desc = val;
		break;
	case 'book-cls':
		books[bookName].cls = val;
		break;
	case 'book-html':
		books[bookName].html = val;
		break;
	}
}

function onFormat () {
	document.getElementById('output').textContent = formatCollection();
}

function onSave () {
	util.file.save(formatCollection(), 'output.html');
}

function onOpen () {
	util.parseFile().then(function (data) {
		loadCollection(data, document.getElementById('merge').checked);
	});
}

function onCreateStructure () {
	var mode = document.getElementById('scrap-mode').value,
		scrapData = document.getElementById('scrap-data').value;
	if (mode === 'bibleserver') {
		generateStructure(scrapData || 'EU', document.getElementById('merge').checked);
	} else if (mode === 'vaticanbible') {
		generateStructure('vaticanbible', document.getElementById('merge').checked);
	} else {
		alert('Generation of structure neither possible nor neccessary');
	}
}

function onScrap () {
	var mode = document.getElementById('scrap-mode').value,
		scrapData = document.getElementById('scrap-data').value,
		single = ['vatican', 'bibleserver-debug', 'vaticanbible-debug'];
	if (single.indexOf(mode) === -1) {
		scrapBooks(mode).then(function () {
			alert('Done');
		}, function (e) {
			alert('Something went wrong: ' + e);
		});
	} else {
		util.scrap(mode, scrapData).then(function (book) {
			data.structure = (data.structure ? data.structure + '\n' : '') + book.title;
			addHtmlBook(book.title, book.html);
			updatePage();
		}, function (e) {
			alert('Something went wrong: ' + e);
		});
	}
}

function onChangeId () {
	var bookName = document.getElementById('book-name').value,
		oldId = books[bookName].id,
		newId = window.prompt('New ID:', oldId);
	if (newId && newId !== oldId) {
		books[bookName].id = newId;
		books[bookName].html = books[bookName].html.replace(new RegExp('\\b' + oldId + '-', 'g'), newId + '-');
		updatePage();
	}
}

function onCheck () {
	var warnings = checkBooks();
	alert(warnings.length ? 'Warnings for these books: ' + warnings.join('; ') : 'No warnings');
	updatePage();
}

function onEdit () {
	var input = document.getElementById('book-html');
	util.wysiwyg(input.value, function (newValue) {
		if (newValue !== false) {
			input.value = newValue;
			onChange({target: input});
		}
	});
}

function onShowStructure () {
	var structure = showStructure(document.getElementById('book-html').value, Infinity);
	alert(structure);
	console.log(structure);
}

function init () {
	updatePage();
	document.addEventListener('change', onChange);
	document.getElementById('button-format').addEventListener('click', onFormat);
	document.getElementById('button-save').addEventListener('click', onSave);
	document.getElementById('button-open').addEventListener('click', onOpen);
	document.getElementById('button-structure').addEventListener('click', onCreateStructure);
	document.getElementById('button-scrap').addEventListener('click', onScrap);

	document.getElementById('button-id').addEventListener('click', onChangeId);

	document.getElementById('button-check').addEventListener('click', onCheck);

	document.getElementById('button-edit').addEventListener('click', onEdit);
	document.getElementById('button-show-structure').addEventListener('click', onShowStructure);
}

init();

})();