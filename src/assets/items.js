
const {hash} = require('../util.js');

const unknown = `aad63cde9b4131d89caba284babb3359`;
const missing = `fc193892eceb38103fbe21dc1baf35cd`;
const count = 344;

const items = [];

// console.assert( items.length === count );

const hashMap = new Map();
hashMap.set( missing, `missing` );
hashMap.set( unknown, `unknown` );
items.forEach( (item, i)=>hashMap.set(item, i+1) );

function hashItemListImg( img ) {
	return hash( img.imgData.data, (x)=>Math.round(255-(255-x)*.9804) );
}

function detect( itemBuffer ) {
	console.log( hash(itemBuffer) );
	return hashMap.get( hash(itemBuffer) );
}

module.exports = {
	unknown, missing, count, items,
	hashItemListImg, detect,
};


// testing img2png...
const {PNG} = require('pngjs/browser');

module.exports.toPNG = function( imageData ) {
	const {width, height, data} = imageData;
	const png = new PNG({width, height});
	// Not necessary: data.forEach( (byte, i)=>png.data[i] = byte );
	png.data = data;
	const buf = PNG.sync.write( png );

	const outPng = PNG.sync.read( buf );

	console.log( data );
	console.log( buf );
	console.log( outPng.data );
	console.assert( data.length === outPng.data.length );
	console.assert( data.every( (v,i)=>outPng.data[i]===v ) );
}
