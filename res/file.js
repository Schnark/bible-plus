/*global util, ZipArchive*/
/*global URL, Blob, Promise, MozActivity*/
(function () {
"use strict";

var mimeMap = {
	html: 'text/html',
	xml: 'application/xml'
}, activityHandler, activityData;

function loadUrl (url, type) {
	var typeMap = {
		arraybuffer: 'arraybuffer',
		html: 'document',
		xml: 'document',
		zip: 'arraybuffer'
	};
	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			var result = xhr.response;
			if (type === 'zip') {
				result = new ZipArchive(result);
			}
			resolve(result);
		};
		xhr.onerror = function () {
			reject('Could not load ' + url);
		};
		xhr.open('GET', url);
		xhr.responseType = typeMap[type] || 'text';
		xhr.overrideMimeType(mimeMap[type] || 'text/plain');
		xhr.send();
	});
}

function readFile (file, type) {
	return new Promise(function (resolve, reject) {
		var reader = new FileReader();
		reader.onload = function (e) {
			var result = e.target.result;
			if (type === 'html' || type === 'xml') {
				result = (new DOMParser()).parseFromString(result, mimeMap[type]);
			} else if (type === 'zip') {
				result = new ZipArchive(result);
			}
			resolve(result);
		};
		reader.onerror = function () {
			reject('Error reading file');
		};
		if (type === 'arraybuffer' || type === 'zip') {
			reader.readAsArrayBuffer(file);
		} else {
			reader.readAsText(file);
		}
	});
}

function extractZip (zip, name, type) {
	var entry, typeMap = {
		arraybuffer: 'arraybuffer',
		zip: 'arraybuffer'
	};
	entry = zip.getEntry(name, typeMap[type] || 'text');
	switch (type) {
	case 'zip':
		return new ZipArchive(entry);
	case 'html':
	case 'xml':
		return (new DOMParser()).parseFromString(entry, mimeMap[type]);
	default:
		return entry;
	}
}

function pickFile (type) {
	var pick, mime;
	mime = mimeMap[type] ? [mimeMap[type], 'application/pdf'] : ['*/*', 'application/pdf']; //pickers that support PDF are good
	return new Promise(function (resolve, reject) {
		var body;

		function onBodyFocus () {
			body.removeEventListener('focus', onBodyFocus, true);
			body.removeChild(pick);
			reject('No file selected');
		}

		if (window.MozActivity) {
			pick = new MozActivity({
				name: 'pick',
				data: {
					type: mime
				}
			});

			pick.onsuccess = function () {
				if (this.result.blob) {
					resolve(this.result.blob);
				} else {
					reject('No file selected');
				}
			};

			pick.onerror = function () {
				reject('No file selected');
			};
		} else {
			pick = document.createElement('input');
			pick.type = 'file';
			pick.style.display = 'none';
			body = document.getElementsByTagName('body')[0];
			body.appendChild(pick);
			pick.addEventListener('change', function () {
				if (pick.files[0]) {
					resolve(pick.files[0]);
				} else {
					reject('No file selected');
				}
				body.removeEventListener('focus', onBodyFocus, true);
				body.removeChild(pick);
			}, false);
			body.addEventListener('focus', onBodyFocus, true);
			pick.click();
		}
	});
}

if (navigator.mozSetMessageHandler) {
	navigator.mozSetMessageHandler('activity', function (request) {
		if (request && request.source && request.source.data && request.source.data.blob) {
			if (activityHandler) {
				activityHandler(request.source.data.blob);
			} else {
				activityData = request.source.data.blob;
			}
		}
	});
}

function registerActivityHandler (handler) {
	activityHandler = handler;
	if (activityData && handler) {
		handler(activityData);
		activityData = null;
	}
}

function save (content, name, mime) {
	var a = document.createElement('a'),
		file = URL.createObjectURL(new Blob([content], {type: mime || 'text/plain'}));
	a.href = file;
	if ('download' in a) {
		a.download = name || '';
	} else {
		a.target = '_blank';
	}
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

util.file = {
	loadUrl: loadUrl,
	readFile: readFile,
	extractZip: extractZip,
	pickFile: pickFile,
	registerActivityHandler: registerActivityHandler,
	save: save
};

})();