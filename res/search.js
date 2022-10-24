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
	var text, ids, id, i, childData;

	function shiftIdData (oldIdData) {
		oldIdData[1] += text.length;
		return oldIdData;
	}

	switch (el.nodeType) {
	case 1:
		//TODO perhaps also drop .id, id-big, .fn, .fn-ref
		if (el.nodeName === 'BR') {
			text = ' ';
		} else if (el.nodeName === 'IMG') {
			text = el.alt || '';
		} else {
			text = '';
		}
		id = el.id || el.dataset.idcont;
		ids = [];
		for (i = 0; i < el.childNodes.length; i++) {
			childData = getTextAndIds(el.childNodes[i]);
			ids = ids.concat(childData.ids.map(shiftIdData));
			text += childData.content;
		}
		if (id) {
			ids.push([id, 0, text.length]);
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

function getParentIds (el, base) {
	var ids = [], id;
	function getId (el) {
		return el.id || (el.dataset && el.dataset.idcont);
	}
	function hasIdOrIsBase (el) {
		return getId(el) || el === base;
	}
	while (el !== base) {
		id = getId(el);
		if (id) {
			ids.push(id);
		}
		el = util.getParent(el.parentNode, hasIdOrIsBase);
	}
	return ids;
}

function getContentAndIds (el, mode) {
	var data, div;
	if (mode === 'code') {
		data = getHtmlAndIds(el);
	} else {
		data = getTextAndIds(el);
	}
	data.content = data.content.replace(/\n/g, ' ');

	if (mode === 'text-fn') {
		div = document.createElement('div');
		Array.prototype.forEach.call(el.querySelectorAll('.fn'), function (fn) {
			var fnText, fnIds;
			div.innerHTML = fn.dataset.content;
			fnText = div.textContent;
			fnIds = getParentIds(fn, el);
			if (fnIds.length > 0) {
				fnIds.forEach(function (id) {
					data.ids.push([id, data.content.length + 1, fnText.length]);
				});
			}
			data.content += '\n' + fnText;
		});
		if (el.classList.contains('fn')) { //this will only happen in highlight mode
			div.innerHTML = el.dataset.content;
			data.content += '\n' + div.textContent;
		}
	}

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
	var nl = text.lastIndexOf('\n');
	if (nl > -1) {
		text = text.slice(nl + 1);
	}
	return text.length > 25 ? '…' + text.slice(-20) : text;
}

function truncateMiddle (text) {
	return text.length > 45 ? text.slice(0, 20) + '…' + text.slice(-20) : text;
}

function truncateEnd (text) {
	var nl = text.indexOf('\n');
	if (nl > -1) {
		text = text.slice(0, nl);
	}
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

	contentAndIds = getContentAndIds(section, options.content);
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

function applyHighlight (options, element, innerOnly) {
	var content, matches, i, match, div, didHighlightChildren, mark;
	if (element.nodeType === 3 || element.nodeType === 4) {
		content = element.textContent;
		if (options.content === 'code') {
			content = util.htmlEscape(content);
		}
	} else {
		if (options.content === 'code') {
			content = innerOnly ? element.innerHTML : element.outerHTML;
		} else {
			content = getContentAndIds(element, options.content).content;
		}
	}
	matches = getMatches(content, options.search, options.ignoreCase, options.regexp);
	if (matches.length === 0) {
		return;
	}
	//highlight text node
	if (element.nodeType === 3) {
		for (i = matches.length - 1; i >= 0; i--) {
			element.splitText(matches[i][0] + matches[i][1]);
			match = element.splitText(matches[i][0]);
			mark = document.createElement('mark');
			match.parentNode.insertBefore(mark, match);
			mark.appendChild(match);
		}
		return true;
	}
	//highlight footnote
	if (element.dataset && element.dataset.content) {
		div = document.createElement('div');
		div.innerHTML = element.dataset.content;
		if (applyHighlight(options, div, true)) {
			element.dataset.content = div.innerHTML;
		}
	}
	//highlight children
	Array.prototype.slice.call(element.childNodes).forEach(function (child) {
		if (applyHighlight(options, child)) {
			didHighlightChildren = true;
		}
	});
	if (!didHighlightChildren) {
		//this means the match spans several child nodes, or is inside the tag
		//just highlight all content
		mark = document.createElement('mark');
		if (element.childNodes.length) {
			while (element.childNodes.length) {
				mark.appendChild(element.childNodes[0]);
			}
			element.appendChild(mark);
		} else {
			element.parentNode.insertBefore(mark, element);
			mark.appendChild(element);
		}
	}
	return true;
}

function highlight (options, section) {
	applyHighlight(options, section, true);
	return section;
}

util.search = {
	searchSection: searchSection,
	highlight: highlight
};
})();
