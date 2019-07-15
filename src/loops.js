
// high level strategies

const {wait} = require('./util.js');
const {coords, feats} = require('./ngu.js');

class LoopRunner {
	constructor() {
		this.currentRule = null;
		this.shouldStop = false;
	}

	async sync() {
		await nguJs.io.sync();
		if( this.shouldStop ) { throw `stop`; }
	}
	async wait( s=0 ) {
		if( this.shouldStop ) { throw `stop`; }

		while( s >= 0 ) {
			await wait( Math.min(s, 1) );
			s -= 1;
		}
	}
	async runRule( ruleName, fn ) {
		console.assert( ! this.currentRule, `Trying to start ${ruleName} while ${this.currentRule
		} is running` );

		this.currentRule = ruleName;
		this.shouldStop = false;
		nguJs.ui.div.dispatchEvent( new CustomEvent(`nguJs.loop`, {detail:ruleName}) );
		try {
			await fn();
		} catch( err ) {
			if( err !== `stop` ) {
				console.error( err );
				throw err;
			}
		} finally {
			this.currentRule = null;
			nguJs.ui.div.dispatchEvent( new CustomEvent(`nguJs.loop`) );
		}
	}
	mkRule( ruleName, fn ) {
		const loop = ( ...args )=>{
			const opts = args.length > 0 ? args[ args.length-1 ] : {};
			const times = opts.times || Infinity;
			const pause = opts.pause || 0;

			return this.runRule( ruleName, async ()=>{
				for( let i = 0; i < times; ++i ) {
					await fn.apply( this, args );
					await this.sync(); // waiting for all input to be processed
					await this.wait( pause ); // waiting for an extra bit
				}
			});
		};
		loop.fn = fn;
		return loop;
	}
	awaitRule() {
		return new Promise( (resolve, reject)=>
			nguJs.ui.div.addEventListener( `nguJs.loop`, resolve, {once:true} )
		);
	}
	async stop() {
		if( this.currentRule ) {
			this.shouldStop = true;
			await this.awaitRule();
			this.shouldStop = false;
			console.assert( !this.currentRule, `Rule didn't stop...` );
		}
	}

	loops( nguJs ) {
		const {logic, io} = nguJs;

		return {
			fixInv: this.mkRule( `fix inventory`, async function() {
				logic.inv.goTo();
				logic.inv.applyAllBoostsToCube();
				logic.inv.mergeAllSlots();
			}),

			snipeBoss: this.mkRule( `snipe boss`, async function() {
				logic.adv.goTo();

				const {move} = coords.adv.moves;

				let bossFound = false;

				await this.sync();

				while( true ) {
					const [{moves, boss, enemyAlive}, needHeal, needHealBadly] = await Promise.all([
						logic.adv.getFightInfo(),
						logic.adv.hpRatioIsAtLeast( .8 ).then( x=>!x ),
						logic.adv.hpRatioIsAtLeast( .5 ).then( x=>!x ),
					]);

					bossFound = bossFound || ( enemyAlive && boss );
					if( bossFound && ! enemyAlive ) {
						console.log( `done killing the boss!` );
						return;
					}

					const chosenMove = (()=>{
						if( moves.idle.active ) {
							console.log( `disabling idle attack` );
							return move.idle;
						}

						if( enemyAlive && ! boss ) {
							console.log( `!boss: skipping` );
							logic.adv.prevArea();
							logic.adv.nextArea();
							return;
						}

						if( needHealBadly ) {
							console.log( `need urgent heal!` );
							if( moves.defBuff.ready ) { return move.defBuff; }
							if( moves.heal.ready ) { return move.heal; }
							if( moves.regen.ready ) { return move.regen; }
						}

						if( ! enemyAlive ) {
							if( needHeal ) {
								if( moves.heal.ready ) { return move.heal; }
								if( moves.regen.ready ) { return move.regen; }
							}
							if( moves.parry.ready ) { return move.parry; }
							return;
						}

						// actual fighting
						if( moves.ultimate.ready && (moves.charge.ready || moves.charge.active) ) {
							if( moves.offBuff.ready ) { return move.offBuff; }
							if( moves.ultBuff.ready ) { return move.ultBuff; }
							if( moves.charge.ready ) { return move.charge; }
						}
						if( moves.ultimate.ready ) { return move.ultimate; }
						if( moves.piercing.ready ) { return move.piercing; }
						if( moves.strong.ready ) { return move.strong; }
						if( moves.regular.ready ) { return move.regular; }

						// console.log( `no attack ready` );
					})();

					if( chosenMove ) {
						console.log( `Using move`, chosenMove.name );
						logic.adv.attack( chosenMove );
					}

					await this.sync();
				}
			}),

			mainLoop: this.mkRule( `snipe and fix inventory`, async function(){
				await nguJs.loops.fixInv.fn.apply( this );
				await this.sync();
				await nguJs.loops.snipeBoss.fn.apply( this );
			}),

		};
	}
}

module.exports = {
	LoopRunner,
};
