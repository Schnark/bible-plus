/*global util*/
(function () {
"use strict";
var editor, input, callback;

function init () {
	editor = document.getElementById('wysiwyg-editor');
	input = document.getElementById('wysiwyg-input');
	document.getElementById('wysiwyg-cancel').addEventListener('click', function () {
		closeEditor(false);
	});
	document.getElementById('wysiwyg-save').addEventListener('click', function () {
		closeEditor(input.innerHTML);
	});
}

function closeEditor (value) {
	editor.hidden = true;
	if (callback) {
		callback(value);
		callback = null;
	}
}

function wysiwyg (oldValue, cb) {
	input.innerHTML = oldValue;
	callback = cb;
	editor.hidden = false;
}

init();

util.wysiwyg = wysiwyg;
})();