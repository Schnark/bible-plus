/*global util: true*/
/*global Promise*/
util =
(function () {
"use strict";

var util = {
	getParent: function (el, nameOrCheck) {
		var check;

		function nameCheck (el) {
			return el.tagName === nameOrCheck;
		}

		check = typeof nameOrCheck === 'string' ? nameCheck : nameOrCheck;
		while (el && !check(el)) {
			el = el.parentNode;
		}
		return el;
	},
	htmlEscape: function (str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	},
	reEscape: function (str) {
		return String(str).replace(/([\\{}()|.?*+\-\^$\[\]])/g, '\\$1');
	},
	openTag: function (tag, attr) {
		function formatAttr (name, value) {
			return (value || value === 0) ? ' ' + name + '="' + util.htmlEscape(value) + '"' : '';
		}

		function formatAttrs (attr) {
			return Object.keys(attr).map(function (name) {
				return formatAttr(name, attr[name]);
			}).join('');
		}

		return '<' + tag + formatAttrs(attr) + '>';
	},
	getAttr: function (el, lower) {
		var attr, attrList, name, i;
		attr = {};
		attrList = el.attributes || [];
		for (i = 0; i < attrList.length; i++) {
			name = attrList[i].name;
			if (lower) {
				name = name.toLowerCase();
			}
			attr[name] = attrList[i].value;
		}
		return attrList;
	},
	tidy: function (html, allowedTags) {
		allowedTags = allowedTags || [];
		return html.replace(/<(\/?)([^<> ]+)(?: ([^<>]*))?>/g, function (all, close, tag/*, attr*/) {
			tag = tag.toLowerCase();
			if (allowedTags.indexOf(tag) > -1) {
				return '<' + close + tag + '>';
			}
			return '';
		});
	},
	createFootnote: function (html, name, tag, cls) {
		return util.openTag(tag || 'sup', {'class': 'fn' + (cls ? ' ' + cls : ''), 'data-content': html}) +
			util.htmlEscape(name || '*') +
			'</' + (tag || 'sup') + '>';
	},
	walkElement: function (base, callback, lower) {
		function perhapsLower (str) {
			return lower ? str.toLowerCase() : str;
		}
		function walkChildren (el) {
			[].slice.call(el.childNodes).map(walkNode);
		}
		function walkNode (el) {
			var children, i, attr, attrList, tag;
			switch (el.nodeType) {
			case 1:
				attr = {};
				attrList = el.attributes || [];
				for (i = 0; i < attrList.length; i++) {
					attr[perhapsLower(attrList[i].name)] = attrList[i].value;
				}
				tag = perhapsLower(el.nodeName);
				children = callback(tag, attr, el);
				if (children) {
					walkChildren(el);
					callback(tag);
				}
				break;
			case 3:
			case 4:
				callback('', el.textContent);
				break;
			case 9:
			case 11:
				walkChildren(el);
			}
		}
		if (base) {
			walkNode(base);
		}
	},
	convertElement: function (base, converter, lower) {
		var result = [], close = [];
		util.walkElement(base, function (tag, attr, el) {
			var data;
			if (!tag) {
				result.push(attr); //text node, text in attr
			} else if (attr) {
				data = converter(tag, attr, el);
				if (!data) {
					return;
				}
				if (typeof data === 'string') {
					result.push(data);
					return;
				}
				result.push(data.pre || '');
				close.push(data.post || '');
				return true;
			} else {
				result.push(close.pop());
			}
		}, lower);
		return result.join('');
		/*function perhapsLower (str) {
			return lower ? str.toLowerCase() : str;
		}
		function convertChildren (el) {
			return [].slice.call(el.childNodes).map(convertNode).join('');
		}
		function convertNode(el) {
			var data, i, attr, attrList;
			switch (el.nodeType) {
			case 1:
				attr = {};
				attrList = el.attributes || [];
				for (i = 0; i < attrList.length; i++) {
					attr[perhapsLower(attrList[i].name)] = attrList[i].value;
				}
				data = converter(perhapsLower(el.nodeName), attr, el);
				if (!data) {
					return '';
				}
				if (typeof data === 'string') {
					return data;
				}
				return (data.pre || '') + convertChildren(el) + (data.post || '');
			case 3:
			case 4:
				return el.wholeText;
			case 9:
			case 11:
				return convertChildren(el);
			default:
				return '';
			}
		}
		return base ? convertNode(base) : '';*/
	},
	asyncMap: function (array, callback) {
		return new Promise(function (resolve, reject) {
			var result = [];
			function next () {
				if (array.length === result.length) {
					resolve(result);
					return;
				}
				Promise.resolve(callback(array[result.length])).then(function (r) {
					result.push(r);
					next();
				}, reject);
			}
			next();
		});
	}
};

return util;
})();