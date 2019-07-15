
// high level logic routines

const {px} = require('./util.js');
const {seq, wait} = require('./util.js');
const {coords, feats, colors} = require('./ngu.js');

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
		await mouse.move( coords.inv.equip.cube.center );
		await mouse.click( 2 );
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
			result[name] = {active, state};
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
}

Object.assign( module.exports, {Logic} );
