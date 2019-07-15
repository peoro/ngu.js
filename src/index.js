
const util = require('./util.js');
const ui = require('./ui.js');
const io = require('./io.js');
const ngu = require('./ngu.js');
const logic = require('./logic.js');
const loops = require('./loops.js');
const gui = require('./gui.js');
const nguJs = require('./ngujs.js');

Object.assign( module.exports = {
	util, ui, io, ngu, logic, loops, gui, nguJs,
});

async function main() {
	// uninstalling previous version of NGU.js
	if( window.nguJs ) {
		console.log( `Found a previous version of NGU.js. Uninstalling it.` );
		try {
			await util.withTimeout( window.nguJs.destroy() );
		} catch( e ) {
			console.error(`There was an issue uninstalling the previous version of NGU.js:`, e );
		}
	}

	// fetching the game canvas
	const gameCanvas = document.getElementById( '#canvas' );
	{
		if( ! gameCanvas ) {
			console.log( `%cCouldn't find the game canvas!`, `color:red; font-size:x-large;` );
			console.log( `%cMake sure that the game has loaded, and that you're pasting this code into "gameiframe" (in the dropdown menu of this JavaScript console - by default it reads "top")`, `color:red;` );
			return;
		}
	}

	// instantiating NGU.js
	window.nguJs = new nguJs.NguJs( gameCanvas );
	window.nguJsLib = module.exports;

	// printing a how-to message
	{
		const comment = (str)=>console.log( `%c// ${str}`, `color:Green;` );
		const code = (str)=>console.log( `%c${str}`, `font-family: monospace;` );
		const space = ()=>console.log();

		comment(`To start hacking with this:`);
		code(`var {px, rect} = nguJsLib.util;
var {coords, colors} = nguJsLib.ngu;`);
		space();
		comment(`Draw a point or a rect for debugging:`);
		code(`nguJs.debug( coords.inv.slot(5,2) );
nguJs.debug( coords.inv.slot(5,2).center );
coords.inv.slot(5,2).toString();`);
		space();
		comment(`Run some small pieces of logic:`);
		code(`nguJs.focus();
nguJs.logic.inv.applyAllBoostsToCube();`);
		space();
		comment(`Run game management routines:`);
		code(`nguJs.loops.fixInv();`);
		space();
		comment(`To stop game management routines:`);
		code(`nguJs.loopRunner.stop();`);
		space();
		comment(`To uninstall:`);
		code(`nguJs.destroy();`);
	}
}

if( module === require.main ) {
	main();
}
