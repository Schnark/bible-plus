(function () {
"use strict";

function makeImgUrl (img, params) {
	var canvas = document.createElement('canvas'),
		context = canvas.getContext('2d'),
		s, w, h;
	s = Math.min(1, params.maxSize / img.width, params.maxSize / img.height);
	w = Math.round(img.width * s);
	h = Math.round(img.height * s);
	canvas.width = w;
	canvas.height = h;
	if (params.fill) {
		context.fillStyle = params.fill;
		context.fillRect(0, 0, w, h);
	}
	context.drawImage(img, 0, 0, w, h);
	return {
		src: canvas.toDataURL(params.format, params.quality),
		width: w,
		height: h
	};
}

function blobToImgUrl (params, callback) {
	var img = new Image(), reader = new FileReader();
	img.addEventListener('load', function () {
		if (params.raw) {
			callback({src: img.src, width: img.width, height: img.height});
		} else {
			callback(makeImgUrl(img, params));
		}
	});
	reader.addEventListener('load', function () {
		img.src = reader.result;
	});
	reader.readAsDataURL(params.blob);
}

function getParams () {
	var params = {
		blob: document.getElementById('image').files[0],
		raw: document.getElementById('raw').checked,
		maxSize: Number(document.getElementById('max-size').value),
		fill: document.getElementById('fill').value,
		format: document.getElementById('format').value,
		quality: Number(document.getElementById('quality').value)
	};
	if (params.maxSize <= 0) {
		params.maxSize = 256;
	}
	if (params.quality <= 0 || params.quality > 1) {
		params.quality = 0.8;
	}
	return params;
}

function onChange () {
	var params = getParams();
	if (params.blob) {
		blobToImgUrl(params, function (result) {
			var html = '<img src="' + result.src + '" width="' + result.width + '" height="' + result.height + '">';
			document.getElementById('output-source').textContent = html;
			document.getElementById('output-example').innerHTML = html;
		});
	}
}

function init () {
	document.getElementById('image').addEventListener('change', onChange);
	document.getElementById('raw').addEventListener('change', onChange);
	document.getElementById('max-size').addEventListener('change', onChange);
	document.getElementById('fill').addEventListener('change', onChange);
	document.getElementById('format').addEventListener('change', onChange);
	document.getElementById('quality').addEventListener('change', onChange);
}

init();

})();