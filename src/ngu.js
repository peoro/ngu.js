
// NGU specific stuff
// This module offers an abstraction over the specific pieces of NGU UI. The bot logic uses this data to interpret what it sees on the canvas, and to decide where to move the mouse in order to perform actions.

// TODO(peoro): some ideas...
// - Something similar to `PixelDetector` should be used to prepare for OCR. Maybe something to specify the rect to read, and a regex or string parser to parse the data and convert it to JSON?
// - We should implement some functions to assert the validity of this data. Something is likely to change and break when NGU is updated. A "test" logic (available through a button in the GUI) would be ideal.
// - We should use OCR to load NGU build version. If NGU's version is different from what we expected, NGU.js should display a warning and suggest to run the test described above.
// - We should provide a piece of code to gather all the images that we need for feature recognition. E.g. all the item pictures from the item list, all the titles for the adventure zones etc. This can be used to build a hashmap to easily recognize image: that will be included in the source code. A cool optimization, might be to compare all the collected images in order to generate an image detection tree that does as few checks as possible to detect the item.

const {px, rect, rectS} = require('./util.js');
const {PixelDetector, Palette} = require('./color.js');
const {GridLayout, Bar, RegularButton, MoveButton, ItemSlot, InventorySlot, ItemListSlot, PlusMinusCap, PlusMinusCapSmall} = require('./ngu_widgets.js')


// canvas size
const size = px( 960, 600 );

// TODO(peoro): create frames within NGU
// stuff like `inventory.page[n]`, `equipment`, `daycare`, `itopodperks`, `ngumagic`...
// anything that is within a frame that might be accessed, basically.
// each frame should contain info on how to recognize it, how to reach it (e.g. by clicking on some button in other frames) etc.
// each widget should then say which frame it belongs to, this way, when we try to use a widget, NGU.js will automatically make sure to show the frame the widget belongs to.
// by doing this we'll be able to avoid unnecessary input events (e.g. don't click on the adventure feature button, if we're already in the adventure screen), and to prevent sending input to the wrong screen.
const frames = {
};

class Digger {
	constructor( page, corner ) {
		this.page = page;
		this.corner = corner;
	}
}

// grid layouts
const grids = {
	features: {
		features: new GridLayout( rect(px(176,30), px(290,523)), px(1, 17), RegularButton ),
		selloutShop: rect(px(176,524), px(290,583)),
	},
	adventure: {
		moves: new GridLayout( rect(px(313,85), px(945,194)), px(6,3), MoveButton ),
	},
	inventory: {
		inventory: new GridLayout( rect(px(326,304), px(926,554)), px(12, 5), InventorySlot ),
		pages: new GridLayout( rect(px(328,559), px(913,589)), px(9, 1), RegularButton ),
		itemList: {
			pages: new GridLayout( rect(px(316,80), px(598,110)), px(4, 1), RegularButton ), // these buttons are irregular, but fuck it :x
			items: new GridLayout( rect(px(323,134), px(923,584)), px(12, 9), ItemListSlot ),

			// TODO(peoro): investigate the various confirmation popups... do they share size or anything? :F
			clearConfirmationButtons: new GridLayout( rect(px(396,302), px(553,333)), px(2,1), RegularButton ),
		}
	},
	equipment: {
		equipment: new GridLayout( rect(px(302,39), px(652,239)), px(7, 4), InventorySlot ),
		features: new GridLayout( rect(px(657,18), px(729,243)), px(1, 5), RegularButton ),
		loadouts: new GridLayout( rect(px(316,243), px(616,273)), px(10, 1), RegularButton ),
	},
	bm: {
		spells: new GridLayout( rect(px(479,213), px(589,485)), px(1, 8), PlusMinusCap, 0, 8 ),
	},
	ngu: {
		rows: new GridLayout( rect(px(500,225), px(610,535)), px(1, 9), PlusMinusCap, 0, 5 ),
	},
	gd: {
		pages: new GridLayout( rect(px(311,95), px(500,123)), px(3, 1), RegularButton, 3, 0 ),
	}
};

// coordinates (relative to a canvas of size `size`)
const ngu = {
	size,
	grids, // not really necessary, but useful for debugging
	frames,
	main: {
		settings: rect(px(11,528), px(49,558)),
	},
	features: {
		buttons: grids.features.features.createObj({
			bt:0, boss:1, pit:2, adv:3, inv:4, aug:5, at:6, tm:7, bm:8, wand:9, ngu:10, ygg:11, gd:12, bp:13,
		}),
	},
	adv: {
		moves: grids.adventure.moves.createObj({
			idle:{i:0, key:`q`}, regular:{i:1, key:`w`}, strong:{i:2, key:`e`}, parry:{i:3, key:`r`}, piercing:{i:4, key:`t`}, ultimate:{i:5, key:`y`},
			block:{i:6, key:`a`}, defBuff:{i:7, key:`s`}, heal:{i:8, key:`d`}, offBuff:{i:9, key:`f`}, charge:{i:10, key:`g`}, ultBuff:{i:11, key:`h`},
			paralyze:{i:12, key:`z`}, regen:{i:13, key:`x`}, locked:{i:14, key:`c`}, locked:{i:15, key:`v`}, locked:{i:16, key:`b`}, move69:{i:17, key:`n`},
		}),
		self: {
			hpBar: new Bar( rect(px(317,403), px(517,428)) ),
		},
		enemy: {
			hpBar: new Bar( rect(px(734,403), px(934,428)) ),
		},
		bossDetector: new PixelDetector( px(740,280), new Palette([[0xf7ef29ff, true]], false) ),
	},
	inv: {
		inventory: grids.inventory.inventory.createAll(),

		equip: grids.equipment.equipment.createObj({
			acc: [px(3,0), px(3,1), px(3,2), px(3,3), px(2,3), px(2,2), px(2,1), px(2,0), px(1,0), px(1,1), px(1,2), px(1,3), px(0,3), px(0,2)],
			head: px(4,0), chest:px(4,1), weapon:px(5,1), weapon1:px(5,1), weapon2:px(5,2), legs:px(4,2), shoes:px(4,3),
		}),
		cube: grids.equipment.equipment.createWidget( px(6,1) ),
		trash: grids.equipment.equipment.createWidget( px(6,3) ),
		feats: grids.equipment.features.createObj({
			wtf:0, itemList:1, daycare:2, fragments:3, statsBreakdown:4,
		}),
		loadout: grids.equipment.loadouts.createAll(),
	},
	itemList: {
		clear: new RegularButton( rect(px(320,11), px(390,46)) ),
		clearDialog: grids.inventory.itemList.clearConfirmationButtons.createObj({
			yes:px(0,0), no:px(1,0),
		}),
		pages: grids.inventory.itemList.pages.createAll(),
		items: grids.inventory.itemList.items.createAll(),
	},
	wand: {
		energy: new PlusMinusCap( rect(px(536, 235), px(646, 265)) ),
		magic: new PlusMinusCap( rect(px(536, 333), px(646, 363)) ),
	},
	bm: {
		spells: grids.bm.spells.createAll(),
	},
	ngu: {
		rows: grids.ngu.rows.createAll(),
		switchPage: new RegularButton( rect(px(311, 94), px(441,124)) ),
	},
	gd: {
		tl: {
			toggle: new RegularButton( rectS(px(330, 228), px(20,20)) ),
			control: new PlusMinusCapSmall( rect(px(471, 174), px(566, 197)) ),
		},
		tr: {
			toggle: new RegularButton( rectS(px(646, 228), px(20,20)) ),
			control: new PlusMinusCapSmall( rect(px(787, 174), px(882, 197)) ),
		},
		bl: {
			toggle: new RegularButton( rectS(px(330, 418), px(20,20)) ),
			control: new PlusMinusCapSmall( rect(px(471, 364), px(566, 387)) ),
		},
		br: {
			toggle: new RegularButton( rectS(px(646, 418), px(20,20)) ),
			control: new PlusMinusCapSmall( rect(px(787, 364), px(882, 387)) ),
		},
		pages: grids.gd.pages.createAll(),
		clear: new RegularButton( rect(px (871, 67), px (940, 123)) ),
		capSaved: new RegularButton( rect(px (724, 98), px (869, 126)) ),
		digger: {
			drop: new Digger(0, "tl"),
			wand: new Digger(0, "tr"),
			stat: new Digger(0, "bl"),
			adv: new Digger(0, "br"),
			engu: new Digger(1, "tl"),
			mngu: new Digger(1, "tr"),
			ebrd: new Digger(1, "bl"),
			mbrd: new Digger(1, "br"),
			pp: new Digger(2, "tl"),
			dayc: new Digger(2, "tr"),
			blood: new Digger(2, "bl"),
			xp: new Digger(2, "br"),
		}
	}
};

Object.assign( module.exports, ngu );
