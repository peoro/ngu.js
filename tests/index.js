
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


describe( `NGU.js`, function(){

	beforeEach( function(){
		const dom = new JSDOM( `<!DOCTYPE html><html><body><canvas id="#canvas" width=960 height=600></canvas></body></html>`, {pretendToBeVisual:true} );
		global.window = dom.window;
		global.document = dom.window.document;
	});
	afterEach( function(){
		delete global.window;
		delete global.document;
	});

	require('./io.js');
});
