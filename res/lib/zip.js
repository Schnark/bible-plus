/*global ZipArchive: true*/
/*global pako*/
/*global TextDecoder*/
ZipArchive =
(function () {
"use strict";

function stringFromArray (array) {
	return (new TextDecoder()).decode(array);
}

function makeArraybuffer (oldArray) {
	var arraybuffer = new ArrayBuffer(oldArray.length),
		newArray = new Uint8Array(arraybuffer);
	newArray.set(oldArray);
	return arraybuffer;
}

function readEntry (entry) {
	switch (entry.compression) {
	case 0:
		return entry.data;
	case 8:
		return pako.inflateRaw(entry.data);
	default:
		throw new Error('Unknown compression type: ' + entry.compression);
	}
}

function ZipArchive (arraybuffer) {
	var offset = 0, data = new DataView(arraybuffer);

	function getUint32 () {
		var val = data.getUint32(offset, true);
		offset += 4;
		return val;
	}

	function getUint16 () {
		var val = data.getUint16(offset, true);
		offset += 2;
		return val;
	}

	function getEntry () {
		var entry = {},
			length, nameLength, extraLength, commentLength, headerOffset, nextEntryIndex;
		if (getUint32() !== 0x02014b50) {
			throw new Error('No central file header signature');
		}
		offset += 6;
		entry.compression = getUint16();
		offset += 8;
		length = getUint32();
		offset += 4;
		nameLength = getUint16();
		extraLength = getUint16();
		commentLength = getUint16();
		offset += 8;
		headerOffset = getUint32();
		entry.name = stringFromArray(new Uint8Array(arraybuffer, offset, nameLength));
		nextEntryIndex = offset + nameLength + extraLength + commentLength;
		offset = headerOffset;
		if (getUint32() !== 0x04034b50) {
			throw new Error('No local file header signature');
		}
		offset += 22;
		nameLength = getUint16();
		extraLength = getUint16();
		entry.data = new Uint8Array(arraybuffer, offset + nameLength + extraLength, length);
		offset = nextEntryIndex;
		return entry;
	}

	function getEntries () {
		var entries = [],
			start, count, i;
		for (start = arraybuffer.byteLength - 22; start > 0; start--) {
			offset = start;
			if (getUint32() === 0x06054b50) {
				offset += 6;
				count = getUint16();
				offset += 4;
				offset = getUint32();
				for (i = 0; i < count; i++) {
					entries.push(getEntry());
				}
				return entries;
			}
		}
		throw new Error('No central dir signature');
	}

	this.entries = getEntries();
}

ZipArchive.prototype.getEntries = function () {
	return this.entries.map(function (entry) {
		return entry.name;
	});
};

ZipArchive.prototype.getEntry = function (name, type) {
	var entry = this.entries.filter(function (entry) {
		return entry.name === name;
	})[0];
	if (!entry) {
		throw new Error('File "' + name + '" does not exist');
	}
	entry = readEntry(entry);
	if (type !== 'arraybuffer') {
		entry = stringFromArray(entry);
	} else {
		entry = makeArraybuffer(entry);
	}
	return entry;
};

return ZipArchive;
})();