
const fs = require('fs');
const {ImageView} = require('../src/image.js');
const {PNG} = require('pngjs/browser');

const pngData = fs.readFileSync('/tmp/page1.png');
const png = PNG.sync.read( pngData );

console.log( png.data.slice(0, 10) );
