
// high level logic routines

const {px} = require('./util.js');
const {seq, wait} = require('./util.js');
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

	async queryPixel( pixelColor, baseObj ) {
		const base = baseObj ?
			baseObj.rect.topLeft :
			px(0,0);

		const color = await nguJs.io.framebuffer.getPixel( base.clone().add(pixelColor.offset) );
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

	async getMovesInfo() {
		const {logic} = this;
		const {moveActive, moveState} = colors.adv;

		const result = {};

		let offset = 0;
		const promises = Object.entries(coords.adv.moves.move).map( async ([name, move])=>{
			const [active, state] = await Promise.all([
				logic.queryPixel( moveActive, move ),
				logic.queryPixel( moveState, move ),
			])
			result[name] = {active, state, ready: state===`ready` && !active };
		});
		await Promise.all( promises );

		return result;
	}
	isEnemyAlive() { return this.logic.queryPixel( colors.adv.enemyAlive ); }
	isBoss() { return this.logic.queryPixel( colors.adv.boss ); }
	async getFightInfo() {
		const [moves, boss, enemyAlive] = await Promise.all([
			this.getMovesInfo(),
			this.isBoss(),
			this.isEnemyAlive(),
		]);
		return {moves, boss, enemyAlive};
	}

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
