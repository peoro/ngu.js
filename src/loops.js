
// high level strategies

const io = require('./io.js');
const {coords, feats} = require('./ngu.js');
const logic = require('./logic.js');

class LoopRunner {
	constructor() {
		this.currentRule = null;
		this.shouldStop = false;
	}

	wait( s ) {
		if( this.shouldStop ) { throw `stop`; }
		return peoros.util.wait( s );
	}
	async runRule( ruleName, fn ) {
		console.assert( ! this.currentRule, `Trying to start ${ruleName} while ${this.currentRule
		} is running` );

		this.currentRule = ruleName;
		this.shouldStop = false;
		try {
			await fn();
		} catch( err ) {
			if( err != `stop` ) {
				throw err;
			}
		}
		this.currentRule = null;
		window.dispatchEvent( new Event(`peoros.logic.stopped`) );
	}
	mkRule( ruleName, fn ) {
		return (args)=>{
			return this.runRule( `mergeLoop`, ()=>fn.apply(this, args) );
		};
	}
	awaitRule() {
		return new Promise( (resolve, reject)=>
			window.addEventListener( `peoros.logic.stopped`, ()=>{
				resolve();
			}, {once:true} )
		);
	}
	stop() {
		if( this.currentRule ) {
			this.shouldStop = true;
			return this.awaitRule();
		}
	}
}
const loopRunner = new LoopRunner();

const mergeLoop = loopRunner.mkRule( `mergeLoop`, async function( {pause=5}={} ) {
	while( true ) {
		// focus lost if you click outside the game
		await io.focus();
		await logic.inv.goTo();
		await logic.inv.applyAllBoostsToCube();
		await this.wait( 0 );
		await logic.inv.mergeAllSlots();

		await this.wait( pause );
	}
});

module.exports = {
	LoopRunner,
	loopRunner,
	stop: ()=>loopRunner.stop(),
	mergeLoop,
};
