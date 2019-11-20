
// high level logic routines

const {px} = require('./util.js');
const {seq} = require('./util.js');
const {Keyboard} = require('./io.js');
const ngu = require('./ngu.js');
const assets = require('./assets.js');

class Logic {
	constructor() {
		this.inv = new InvLogic( this );
		this.adv = new AdvLogic( this );
		this.wand = new WandLogic( this );
		this.bm = new BmLogic( this );
	}

	getRidOfMouse() {
		return nguJs.io.mouse.move( px(-1000,-1000) );
	}

	queryPixel( pixelColor, baseObj ) {
		const base = baseObj ?
			baseObj.rect.topLeft :
			px(0,0);

		const color = nguJs.io.framebuffer.getPixel( base.clone().add(pixelColor.offset) );
		return pixelColor.get( color );
	}

	click( widget ) {
		const {mouse} = nguJs.io;
		mouse.move( widget.center );
		return mouse.click();
	}
}

class FeatureLogic {
	constructor( feature, logic ) {
		this.feature = feature;
		this.logic = logic;
	}

	// goTo() { return this.logic.toFeat( this.feature ); }
	goTo() { nguJs.io.mouse.move( this.feature.rect.center ); return nguJs.io.mouse.click(); }
}

class WandLogic extends FeatureLogic {
	constructor( logic ) {
		super( ngu.features.buttons.wand, logic );
	}
	capEnergy() {
		const {mouse} = nguJs.io;
		mouse.move( ngu.wand.capEnergy.center );
		mouse.click();
	}
	capMagic() {
		const {mouse} = nguJs.io;
		mouse.move( ngu.wand.capMagic.center );
		mouse.click();
	}
	capAll() {
		this.capEnergy();
		this.capMagic();
	}
}

class BmLogic extends FeatureLogic {
	constructor( logic ) {
		super( ngu.features.buttons.bm, logic );
	}
	cap( idx ) {
		const {mouse} = nguJs.io;
		mouse.move( ngu.bm.cap[idx].center );
		mouse.click();
	}
	capAll() {
		const {mouse} = nguJs.io;
		for ( const btn of ngu.bm.cap) {
			mouse.move( btn.center );
			mouse.click();
		}
	}
}

class InvLogic extends FeatureLogic {
	constructor( logic ) {
		super( ngu.features.buttons.inv, logic );
	}
	merge() { return nguJs.io.keyboard.press( Keyboard.keys.d ); }
	mergeSlot( slot ) {
		const {mouse} = nguJs.io;
		mouse.move( slot.center );
		this.merge();
	}
	//mergeEquip
	//mergeAll

	boost() { return nguJs.io.keyboard.press( Keyboard.keys.a ); }
	boostSlot( slot ) {
		const {mouse} = nguJs.io;
		mouse.move( slot.center );
		this.boost();
	}

	applyAllBoostsToCube() {
		const {mouse} = nguJs.io;
		mouse.move( ngu.inv.cube.center );
		mouse.click( 2 );
	}

	applyLoadout( loadout, resetEnergy=false, resetMagic=false, resetR3=false ) {
		if( resetEnergy ) {
			nguJs.io.keyboard.press( Keyboard.keys.r );
		}
		if( resetMagic ) {
			nguJs.io.keyboard.press( Keyboard.keys.t );
		}
		if( resetR3 ) {
			nguJs.io.keyboard.press( Keyboard.keys.f );
		}
		const {mouse} = nguJs.io;
		mouse.move( loadout.center );
		mouse.click();
	}

	getInvInfo() {
		return ngu.inv.inventory.map( (slot)=>{
			// TODO: move this logic into `ItemSlot` directly....
			const imgData = new ImageView( nguJs.io.framebuffer, slot.innerRect ).toImageData();
			const item = assets.items.detect( imgData.data );
			const state = slot.stateDetector.detect();
			return Object.assign( {item}, state );
		});
	}
}


class AdvLogic extends FeatureLogic {
	constructor( logic ) {
		super( ngu.features.buttons.adv, logic );
	}

	getMovesInfo() {
		const result = {};

		const {moves} = ngu.adv;
		for( let name in moves ) {
			const move = moves[name];
			const active = move.activeDetector.detect();
			const state = move.stateDetector.detect();
			result[name] = {active, state, ready:(state===`ready` && !active) };
		}

		return result;
	}
	isEnemyAlive() { return ngu.adv.enemy.hpBar.getStateDetectorForRatio(0).detect(); }
	isBoss() { return ngu.adv.bossDetector.detect(); }

	hpRatioIsAtLeast( ratio ) {
		return ngu.adv.self.hpBar.getStateDetectorForRatio(ratio).detect();
	}

	idle( on=true ) {
		const moveInfo = this.getMovesInfo();
		if( moveInfo.idle.active !== on ) {
			this.attack( ngu.adv.moves.idle );
		}
	}

	chooseMove() {
		const {logic} = this;
		const {moves} = ngu.adv;
		const moveInfo = logic.adv.getMovesInfo();

		if( moveInfo.idle.active ) {
			console.log( `disabling idle attack` );
			return moves.idle;
		}

		const reallyNeedHeal = ! logic.adv.hpRatioIsAtLeast( .5 );
		if( reallyNeedHeal ) {
			console.log( `need urgent heal!` );
			if( moveInfo.defBuff.ready ) { return moves.defBuff; }
			if( moveInfo.heal.ready ) { return moves.heal; }
			if( moveInfo.regen.ready ) { return moves.regen; }
		}

		if( ! this.isEnemyAlive() ) {
			const needHeal = ! logic.adv.hpRatioIsAtLeast( .8 );
			if( needHeal ) {
				if( moveInfo.heal.ready ) { return moves.heal; }
				if( moveInfo.regen.ready ) { return moves.regen; }
			}
			if( moveInfo.parry.ready ) { return moves.parry; }
			return;
		}

		// actual fighting
		const fullHP = logic.adv.hpRatioIsAtLeast( 1 ); // if we're in a zone where enemies are easy to kill, let's not waste time charging up
		if( !fullHP ) {
			if( moveInfo.paralyze.ready ) { return moves.paralyze; }
			if( moveInfo.block.ready ) { return moves.block; }
		}
		if( !fullHP && moveInfo.ultimate.ready && (moveInfo.charge.ready || moveInfo.charge.active) ) {
			if( moveInfo.offBuff.ready ) { return moves.offBuff; }
			if( moveInfo.ultBuff.ready ) { return moves.ultBuff; }
			if( moveInfo.charge.ready ) { return moves.charge; }
		}
		if( moveInfo.ultimate.ready ) { return moves.ultimate; }
		if( moveInfo.piercing.ready ) { return moves.piercing; }
		if( moveInfo.strong.ready ) { return moves.strong; }
		if( moveInfo.regular.ready ) { return moves.regular; }

		// console.log( `no attack ready` );
	}

	prevArea() { return nguJs.io.keyboard.press( Keyboard.keys.leftArrow ); }
	nextArea() { return nguJs.io.keyboard.press( Keyboard.keys.rightArrow ); }
	attack( move ) {
		const key = Keyboard.keys[move.key];
		return nguJs.io.keyboard.press( key );

		// the following also works, but it's slower (and creates popups that hide move status
		//const {mouse} = nguJs.io;
		//mouse.move( move.center );
		//mouse.click();
		//this.logic.getRidOfMouse();
	}
}

Object.assign( module.exports, {Logic} );
