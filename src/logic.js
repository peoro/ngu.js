
// high level logic routines

const {seq, wait} = require('./util.js');
const {coords, feats} = require('./ngu.js');

class Logic {
	constructor() {
		this.inv = new InvLogic( this );
		this.adv = new AdvLogic( this );
	}

	async toFeat( feature ) {
		const {mouse} = nguJs.io;
		await mouse.move( coords.feat.buttons[feature].center );
		await mouse.click();
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
	merge() { return nguJs.io.keyboard.press( 'd' ); }
	async mergeSlot( slot ) {
		const {mouse} = nguJs.io;
		await mouse.move( slot.px );
		await this.merge();
	}
	async mergeAllSlots() {
		for( let slot of coords.inv.pageSlots ) {
			await this.mergeSlot( slot );
			await wait();
		};
	}
	//mergeEquip
	//mergeAll
	async applyAllBoostsToCube() {
		const {mouse} = nguJs.io;
		await mouse.move( coords.equip.cube.center );
		await mouse.click( 2 );
	}
}

class AdvLogic extends FeatureLogic {
	constructor( logic ) {
		super( feats.adv, logic );
	}
}

Object.assign( module.exports, {Logic} );
