/*global util*/
(function () {
"use strict";

function getHtmlAndIds (el) {
	var html = el.innerHTML, ids;
	ids = Array.prototype.map.call(el.querySelectorAll('[id], [data-idcont]'), function (el) {
		var part = el.outerHTML;
		return [el.id || el.dataset.idcont, html.indexOf(part), part.length];
	});
	return {
		content: html,
		ids: ids
	};
}

function getTextAndIds (el) {
	var text, ids, i, childData;

	function shiftIdData (oldIdData) {
		oldIdData[1] += text.length;
		return oldIdData;
	}

	switch (el.nodeType) {
	case 1:
		//TODO perhaps also drop .id, id-big, .fn, .fn-ref
		//TODO perhaps also replace img with alt
		if (el.nodeName === 'BR') {
			return {
				content: ' ',
				ids: []
			};
		}
		text = '';
		ids = [];
		for (i = 0; i < el.childNodes.length; i++) {
			childData = getTextAndIds(el.childNodes[i]);
			ids = ids.concat(childData.ids.map(shiftIdData));
			text += childData.content;
		}
		if (el.id) {
			ids.push([el.id, 0, text.length]);
		} else if (el.dataset.idcont) {
			ids.push([el.dataset.idcont, 0, text.length]);
		}
		return {
			content: text,
			ids: ids
		};
	case 3:
	case 4:
		return {
			content: el.textContent,
			ids: []
		};
	}
}

function getContentAndIds (el, asHTML) {
	var data;
	if (asHTML) {
		data = getHtmlAndIds(el);
	} else {
		data = getTextAndIds(el);
	}
	data.content = data.content.replace(/\n/g, ' ');
	return data;
}

function getMatchesRegexp (text, re) {
	var result, results = [];
	while ((result = re.exec(text))) {
		results.push([result.index, result[0].length]);
	}
	return results;
}

function getMatchesText (text, search) {
	var results = [], pos = 0;
	while (true) {
		pos = text.indexOf(search, pos);
		if (pos === -1) {
			return results;
		}
		results.push([pos, search.length]);
		pos += search.length;
	}
}

function getMatches (text, search, ignoreCase, asRegexp) {
	if (asRegexp) {
		return getMatchesRegexp(text, new RegExp(search, ignoreCase ? 'gi' : 'g'));
	} else {
		//NOTE If .toLowerCase() changes the length this will break slightly.
		//I am not aware of any such cases (though there are cases for toUpperCase),
		//but even if there are the consequences are not severe.
		return getMatchesText(ignoreCase ? text.toLowerCase() : text, ignoreCase ? search.toLowerCase() : search);
	}
}

function getId (ids, pos, len) {
	var i;
	for (i = 0; i < ids.length; i++) {
		if (ids[i][1] <= pos && ids[i][1] + ids[i][2] >= pos + len) {
			return ids[i][0];
		}
	}
	return;
}

function truncateStart (text) {
	return text.length > 25 ? '…' + text.slice(-20) : text;
}

function truncateMiddle (text) {
	return text.length > 45 ? text.slice(0, 20) + '…' + text.slice(-20) : text;
}

function truncateEnd (text) {
	return text.length > 25 ? text.slice(0, 20) + '…' : text;
}

function getSnippet (text, start, end) {
	return util.htmlEscape(truncateStart(text.slice(0, start))) +
		'<mark>' + util.htmlEscape(truncateMiddle(text.slice(start, end))) + '</mark>' +
		util.htmlEscape(truncateEnd(text.slice(end)));
}

function formatMatch (text, ids, pos, len, asCode) {
	return {
		id: getId(ids, pos, len),
		snippet: (asCode ? '<code>' : '') +
			getSnippet(text, pos, pos + len) +
			(asCode ? '</code>' : '')
	};
}

function searchSection (options, section) {
	var contentAndIds, matches, more;

	contentAndIds = getContentAndIds(section, options.content === 'code');
	if (options.content === 'text-fn') {
		contentAndIds.content += '\n' + Array.prototype.map.call(section.querySelectorAll('.fn'), function (fn) {
			return fn.dataset.content; //TODO as text, add id data
		}).join('\n');
	}
	matches = getMatches(contentAndIds.content, options.search, options.ignoreCase, options.regexp);
	if (options.sectionLimit && matches.length > options.sectionLimit) {
		more = {
			more: true,
			range: 'section',
			count: matches.length - options.sectionLimit
		};
		matches.length = options.sectionLimit;
	}
	matches = matches.map(function (data) {
		return formatMatch(contentAndIds.content, contentAndIds.ids, data[0], data[1], options.content === 'code');
	});
	if (more) {
		matches.push(more);
	}
	return matches;
}

util.search = {
	searchSection: searchSection
	//TODO highlight
};
})();
