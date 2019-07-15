
// high level strategies

const {timeSec} = require('./util.js');
const {coords, feats} = require('./ngu.js');

class LoopRunner {
	constructor() {
		this.currentRule = null;
		this.shouldStop = false;
	}

	async sync( nextFrame ) {
		// waiting until next frame
		if( nextFrame ) { await nguJs.io.nextFrame; }

		// waiting until all input events have been processed
		await nguJs.io.sync();

		// stopping
		if( this.shouldStop ) { throw `stop`; }
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
		const loop = async (...args )=>{
			await this.stop();

			const opts = args.length > 0 ? args[ args.length-1 ] : {};
			const times = opts.times || Infinity;
			const pause = opts.pause || 0;

			await this.runRule( ruleName, async ()=>{
				for( let i = 0; i < times; ++i ) {
					await fn.apply( this, args );
					await this.sync( true ); // waiting for all input to be processed
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
				let lastEnemyTime = timeSec();

				while( true ) {
					await this.sync( true ); // making sure that the pixel we're using are fresh

					const moveInfo = logic.adv.getMovesInfo();
					const isBoss = logic.adv.isBoss();
					const isEnemyAlive = logic.adv.isEnemyAlive();

					const now = timeSec();
					if( isEnemyAlive ) { lastEnemyTime = now; }
					bossFound = bossFound || ( isEnemyAlive && isBoss );

					if( bossFound && ! isEnemyAlive ) {
						console.log( `done killing the boss!` );
						return;
					}

					if( now - lastEnemyTime > 10 ) {
						// hmm... I'm probably dead :(
						console.log( `Am I... Dead?! D:` );
						return;
					}

					const chosenMove = (()=>{
						if( moveInfo.idle.active ) {
							console.log( `disabling idle attack` );
							return move.idle;
						}

						if( isEnemyAlive && ! isBoss ) {
							console.log( `!boss: skipping` );
							logic.adv.prevArea();
							logic.adv.nextArea();
							return;
						}

						const reallyNeedHeal = ! logic.adv.hpRatioIsAtLeast( .5 );
						if( reallyNeedHeal ) {
							console.log( `need urgent heal!` );
							if( moveInfo.defBuff.ready ) { return move.defBuff; }
							if( moveInfo.heal.ready ) { return move.heal; }
							if( moveInfo.regen.ready ) { return move.regen; }
						}

						if( ! isEnemyAlive ) {
							const needHeal = ! logic.adv.hpRatioIsAtLeast( .8 );
							if( needHeal ) {
								if( moveInfo.heal.ready ) { return move.heal; }
								if( moveInfo.regen.ready ) { return move.regen; }
							}
							if( moveInfo.parry.ready ) { return move.parry; }
							return;
						}

						// actual fighting
						if( moveInfo.ultimate.ready && (moveInfo.charge.ready || moveInfo.charge.active) ) {
							if( moveInfo.offBuff.ready ) { return move.offBuff; }
							if( moveInfo.ultBuff.ready ) { return move.ultBuff; }
							if( moveInfo.charge.ready ) { return move.charge; }
						}
						if( moveInfo.ultimate.ready ) { return move.ultimate; }
						if( moveInfo.piercing.ready ) { return move.piercing; }
						if( moveInfo.strong.ready ) { return move.strong; }
						if( moveInfo.regular.ready ) { return move.regular; }

						// console.log( `no attack ready` );
					})();

					if( chosenMove ) {
						console.log( `Using move`, chosenMove.name );
						logic.adv.attack( chosenMove );
					}
				}
			}),

			mainLoop: this.mkRule( `snipe and fix inventory`, async function(){
				await nguJs.loops.fixInv.fn.apply( this );
				await nguJs.loops.snipeBoss.fn.apply( this );
			}),

		};
	}
}

module.exports = {
	LoopRunner,
};
