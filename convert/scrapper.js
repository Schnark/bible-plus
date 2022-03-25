/*global util*/
/*global Promise*/
(function () {
"use strict";

var downloadManager = {
	ready: Promise.resolve(),
	pause: 1000,
	get: function (url, type, proxy) {
		var get = downloadManager.ready.then(function () {
			return util.file.loadUrl(proxy ? 'https://jsonp.afeld.me/?url=' + encodeURIComponent(url) : url, type); //TODO
		});
		downloadManager.ready = get['finally'](function () {
			return new Promise(function (resolve) {
				setTimeout(resolve, downloadManager.pause);
			});
		});
		return get;
	}
};

function scrap (url, htmlConverter) {
	var result, i, urls, extern;
	result = /^(.*)_(\d+)_(.*)$/.exec(url);
	if (result) {
		urls = [];
		for (i = 1; i <= result[2]; i++) {
			urls.push(result[1] + i + result[3]);
		}
	} else {
		urls = [url];
	}
	extern = url.slice(0, 4) === 'http';
	downloadManager.pause = extern ? 1000 : 10;
	return htmlConverter.parse(urls.map(function (url) {
		return downloadManager.get(url, htmlConverter.type || 'html', extern);
	}), {url: url});
}

util.converters = {};

util.scrap = function (type, id) {
	var Converter = util.converters[type], converter;
	if (!Converter) {
		return Promise.reject('Unknown type');
	}
	converter = new Converter();
	if (!id) {
		return converter.parse([util.file.pickFile().then(function (file) {
			return util.file.readFile(file, converter.type || 'html');
		})], {url: ''});
	}
	return scrap(Converter.getUrl(id), converter);
};

})();