
// high level logic routines

const {px} = require('./util.js');
const {seq} = require('./util.js');
const {Keyboard} = require('./io.js');
const {coords, feats, colors} = require('./ngu.js');

class Logic {
	constructor() {
		this.inv = new InvLogic( this );
		this.adv = new AdvLogic( this );
	}

	getRidOfMouse() {
		return nguJs.io.mouse.move( px(-1000,-1000) );
	}

	toFeat( feature ) {
		const {mouse} = nguJs.io;
		mouse.move( coords.feat.buttons[feature].center );
		mouse.click();
	}

	queryPixel( pixelColor, baseObj ) {
		const base = baseObj ?
			baseObj.rect.topLeft :
			px(0,0);

		const color = nguJs.io.framebuffer.getPixel( base.clone().add(pixelColor.offset) );
		return pixelColor.get( color );
	}
}

class FeatureLogic {
	constructor( feature, logic ) {
		this.feature = feature;
		this.logic = logic;
	}

	goTo() { return this.logic.toFeat( this.feature ); }
}

class InvLogic extends FeatureLogic {
	constructor( logic ) {
		super( feats.inv, logic );
	}
	merge() { return nguJs.io.keyboard.press( Keyboard.keys.d ); }
	mergeSlot( slot ) {
		const {mouse} = nguJs.io;
		mouse.move( slot.px );
		this.merge();
	}
	mergeAllSlots() {
		for( let slot of coords.inv.pageSlots ) {
			this.mergeSlot( slot );
		};
	}
	//mergeEquip
	//mergeAll
	applyAllBoostsToCube() {
		const {mouse} = nguJs.io;
		mouse.move( coords.inv.equip.cube.center );
		mouse.click( 2 );
	}
}


class AdvLogic extends FeatureLogic {
	constructor( logic ) {
		super( feats.adv, logic );
	}

	getMovesInfo() {
		const {logic} = this;
		const {moveActive, moveState} = colors.adv;
		const moveObj = coords.adv.moves.move;

		const result = {};

		for( let name in moveObj ) {
			const move = moveObj[name];
			const active = logic.queryPixel( moveActive, move );
			const state = logic.queryPixel( moveState, move );
			result[name] = {active, state, ready:(state===`ready` && !active) };
		}

		return result;
	}
	isEnemyAlive() { return this.logic.queryPixel( colors.adv.enemyAlive ); }
	isBoss() { return this.logic.queryPixel( colors.adv.boss ); }

	hpRatioIsAtLeast( ratio ) {
		return this.logic.queryPixel( colors.adv.ownHpRatioAtLeast(ratio) );
	}

	prevArea() { return nguJs.io.keyboard.press( Keyboard.keys.leftArrow ); }
	nextArea() { return nguJs.io.keyboard.press( Keyboard.keys.rightArrow ); }
	attack( move ) {
		// TODO(peoro): let's use key shortcuts instead of moving mouse back and forth D:
		const {mouse} = nguJs.io;
		mouse.move( move.px );
		mouse.click();
		this.logic.getRidOfMouse();
	}
}

Object.assign( module.exports, {Logic} );
