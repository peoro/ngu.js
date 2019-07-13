
const util = require('./util.js');
const ui = require('./ui.js');
const io = require('./io.js');
const ngu = require('./ngu.js');
const logic = require('./logic.js');
const loops = require('./loops.js');

function uninstall() {
	if( window.peoros ) {
		try {
			window.peoros.logic.stop();
		} catch(e) {}
	}

	// removing old div, if any
	const div = document.getElementById( `peorosDiv` );
	if( div ) { div.remove(); }
}

const peoros = module.exports = {
	util, ui, io, ngu, logic, loops, uninstall,
};

if( module === require.main ) {
	uninstall();

	{
		const gameCanvas = document.getElementById( '#canvas' );
		if( ! gameCanvas ) {
			console.log( `%cCouldn't find the game canvas!`, `color:red; font-size:x-large;` );
			console.log( `%cMake sure that the game has loaded, and that you're pasting this code into "gameiframe" (in the dropdown menu of this JavaScript console - by default it reads "top")`, `color:red;` );
			return;
		}
	}

	window.peoros = peoros;

	{
		const comment = (str)=>console.log( `%c// ${str}`, `color:Green;` );
		const code = (str)=>console.log( `%c${str}`, `font-family: monospace;` );
		const space = ()=>console.log();

		comment(`To start hacking with this:`);
		code(`var {px, rect} = peoros.util;`);
		space();
		comment(`Draw a point or a rect for debugging:`);
		code(`peoros.ngu.debug( peoros.ngu.coords.inv.slot(5,2) );
peoros.ngu.debug( peoros.ngu.coords.inv.slot(5,2).center );
peoros.ngu.coords.inv.slot(5,2).toString();`);
		space();
		comment(`Start high level pieces of logic:`);
		code(`peoros.io.focus();
peoros.logic.applyAllBoostsToCube();
peoros.loops.mergeLoop();`);
		space();
		comment(`To stop loops:`);
		code(`peoros.loops.stop();`);
		space();
		comment(`To uninstall:`);
		code(`peoros.uninstall();`);
	}

}
