/*global util, bibleData*/
(function () {
"use strict";

function test (re, text, msg) {
	var result;
	if (re.global) {
		return testMulti(re, text, msg);
	}
	result = re.exec(text);
	if (result) {
		return msg.replace('%s', util.htmlEscape(result[0]));
	}
}

function testMulti (re, text, msg) {
	var result, all = [];
	while ((result = re.exec(text))) {
		all.push(util.htmlEscape(result[0]));
	}
	if (all.length) {
		return msg.replace('%s', all.join('; '));
	}
}

util.checkers = [];

util.checkers.push(function (html) {
	if (/<\/h(\d)>\s*<h\1>/.test(html)) {
		return '<p>Double headline</p>';
	}
});

util.checkers.push(function (html) {
	return test(/<([a-z0-9]+)[^>]*>\s*<\/\1>/, html, '<p>Empty element: %s</p>');
});

/*util.checkers.push(function (html) {
	var div = document.createElement('div');
	div.innerHTML = html;
	if (html !== div.innerHTML) {
		return '<p>HTML not normalized</p>';
	}
});*/

util.checkers.push(function (html) {
	return test(/<\/a>[a-z]?\W*\d/g, html, '<p>Link that might be extended: %s</p>') ||
		test(/&lt;\/a&gt;[a-z]?\W*\d/g, html, '<p>Link that might be extended: %s</p>');
});

util.checkers.push(function (html) {
	return test(
		/\d\D{1,3}(?:0\D|[1-9])/g, //allow verse 0 for psalms, but no leading zeros
		html
			.replace(/id="[^"]*"/g, '')
			.replace(/data-idcont="[^"]*"/g, '')
			.replace(/<a .*?<\/a>/g, '')
			.replace(/&lt;a .*?&lt;\/a&gt;/g, ''),
		'<p>Possibly unlinked ref: %s</p>'
	);
});

util.checkers.push(function (html) {
	var doc = document.createElement('div'), h;
	doc.innerHTML = html;
	h = doc.querySelectorAll('[id] h1, [id] h2, [id] h3, [id] h4, [id] h5, [id] h6,' +
		'[data-idcont] h1, [data-idcont] h2, [data-idcont] h3, [data-idcont] h4, [data-idcont] h5, [data-idcont] h6');
	if (h.length > 0) {
		h = [].map.call(h, function (el) {
			el = util.getParent(
				el,
				function (el) {
					return el.id || el.dataset.idcont;
				}
			);
			return el.id || el.dataset.idcont;
		});
		return '<p>There are headlines inside verses: ' + h.join(', ') + '</p>';
	}
});

function basicIdCheck (ids, prefix, postfix, expected) {
	var brokenIds, n;
	brokenIds = ids.filter(function (id) {
		return isNaN(id) || Number(id) <= 0 || Math.floor(id) !== Number(id);
	});
	if (brokenIds.length) {
		return '<p>ID not numerical: ' + brokenIds.map(function (id) {
				return '<code>' + prefix + util.htmlEscape(id) + postfix + '</code>';
			}).join(', ') +
			'</p>';
	}
	n = Math.min.apply(Math, ids);
	if (n !== 1) {
		return '<p>Smallest ID is ' + prefix + n + postfix + '.</p>';
	}
	n = Math.max.apply(Math, ids);
	if (ids.length !== n) {
		return '<p>Some ID is missing (there are ' + ids.length + ' IDs, but the maximum is ' + prefix + n + postfix + ').</p>';
	}
	if (expected && ids.length !== expected) {
		return '<p>Maximum ID is ' + prefix + ids.length + postfix + ', instead of expected ' + expected + '.</p>';
	}
}

function checkOnePartIds (ids, prefix) {
	return basicIdCheck(ids, prefix, '');
}

function checkTwoPartIds (ids, prefix, bibleBookData) {
	var brokenIds, chapters, i, expectedChapters;
	brokenIds = ids.filter(function (id) {
		return id.indexOf('-') === -1;
	});
	if (brokenIds.length) {
		return '<p>ID without hyphen (' +
			brokenIds.map(function (id) {
				return '<code>' + util.htmlEscape(id) + '</code>';
			}).join(', ') +
			')</p>';
	}
	chapters = ids.map(function (id) {
		var pos = id.indexOf('-');
		return [id.slice(0, pos), id.slice(pos + 1)];
	}).reduce(function (acc, current) {
		if (!acc[current[0]]) {
			acc[current[0]] = [];
		}
		acc[current[0]].push(current[1]);
		return acc;
	}, {});

	expectedChapters = bibleBookData && bibleBookData.chapters;
	brokenIds = basicIdCheck(Object.keys(chapters), prefix, '-*', expectedChapters && expectedChapters.length);
	if (brokenIds) {
		return brokenIds;
	}
	for (i = 1; i <= Object.keys(chapters).length; i++) {
		brokenIds = basicIdCheck(chapters[i], prefix + i + '-', '', expectedChapters && expectedChapters[i - 1]);
		if (brokenIds) {
			return brokenIds;
		}
	}
}

util.checkers.push(function (html, data) {
	var div = document.createElement('div'), ids, contIds, brokenIds;
	div.innerHTML = html;
	ids = [].map.call(div.querySelectorAll('[id]'), function (el) {
		return el.id;
	});
	contIds = [].map.call(div.querySelectorAll('[data-idcont]'), function (el) {
		return el.dataset.idcont;
	});
	brokenIds = ids.filter(function (id, pos) {
		return ids.indexOf(id) !== pos;
	});
	if (brokenIds.length) {
		return '<p>Duplicate IDs: ' +
			brokenIds.map(function (id) {
				return '<code>' + util.htmlEscape(id) + '</code>';
			}).join(', ') +
			'</p>';
	}
	brokenIds = contIds.filter(function (id) {
		return ids.indexOf(id) === -1;
	});
	if (brokenIds.length) {
		return '<p>IDs used in <code>data-idcont</code> must be used as <code>id</code>, too. (' +
			brokenIds.map(function (id) {
				return '<code>' + util.htmlEscape(id) + '</code>';
			}).join(', ') +
			')</p>';
	}
	brokenIds = ids.filter(function (id) {
		return id.slice(0, data.id.length + 1) !== data.id + '-';
	});
	if (brokenIds.length) {
		return '<p>IDs must be prefixed with the main ID. (' +
			brokenIds.map(function (id) {
				return '<code>' + util.htmlEscape(id) + '</code>';
			}).join(', ') +
			')</p>';
	}
	if (!(/^[a-z0-9]+$/.test(data.id))) {
		return '<p>Invalid ID <code>' + util.htmlEscape(data.id) + '</code>.</p>';
	}
	if (ids.length === 0) {
		return '<p>No IDs</p>';
	}
	ids = ids.map(function (id) {
		return id.slice(data.id.length + 1);
	});
	if (ids[0].indexOf('-') > -1) {
		return checkTwoPartIds(ids, data.id + '-', bibleData.getBookById(data.id, 'en'));
	}
	return checkOnePartIds(ids, data.id + '-');
});
/*html, data
data.id
data.title
data.abbr
etc.
*/

})();