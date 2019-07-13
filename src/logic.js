
// high level logic routines

const {seq, wait} = require('./util.js');
const {mouse, keyboard} = require('./io.js');;
const {coords, feats} = require('./ngu.js');

async function toFeat( feature ) {
	await mouse.move( coords.feat.buttons[feature].center );
	await mouse.click();
}

async function mergeSlot( col, row ) {
	await mouse.move( coords.inv.slot(col, row).center );
	await keyboard.press( 'd' );
}
async function applyAllBoostsToCube() {
	await mouse.move( coords.equip.cube.center );
	await mouse.click( 2 );
}

module.exports = {
	toFeat,
	inv: {
		goTo: ()=>toFeat(feats.inv),
		merge: ()=>keyboard.press( 'd' ),
		async mergeSlot( slot ) {
			await mouse.move( slot.px );
			await this.merge();
		},
		async mergeAllSlots() {
			for( let slot of coords.inv.pageSlots ) {
				await this.mergeSlot( slot );
				await wait( 0 );
			};
		},
		//mergeEquip,
		//mergeAll,
		applyAllBoostsToCube,
	},
	adv: {
		goTo: ()=>toFeat(feats.adv),

	},
};
