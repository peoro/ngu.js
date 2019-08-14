
// NGU specific stuff
// This module offers an abstraction over the specific pieces of NGU UI. The bot logic uses this data to interpret what it sees on the canvas, and to decide where to move the mouse in order to perform actions.

// TODO(peoro): some ideas...
// - Something similar to `PixelDetector` should be used to prepare for OCR. Maybe something to specify the rect to read, and a regex or string parser to parse the data and convert it to JSON?
// - We should implement some functions to assert the validity of this data. Something is likely to change and break when NGU is updated. A "test" logic (available through a button in the GUI) would be ideal.
// - We should use OCR to load NGU build version. If NGU's version is different from what we expected, NGU.js should display a warning and suggest to run the test described above.
// - We should provide a piece of code to gather all the images that we need for feature recognition. E.g. all the item pictures from the item list, all the titles for the adventure zones etc. This can be used to build a hashmap to easily recognize image: that will be included in the source code. A cool optimization, might be to compare all the collected images in order to generate an image detection tree that does as few checks as possible to detect the item.

const {px, rect} = require('./util.js');
const {PixelDetector, Palette} = require('./color.js');
const {GridLayout, Bar, RegularButton, MoveButton, ItemSlot, InventorySlot, ItemListSlot} = require('./ngu_widgets.js')


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
	},
	equipment: {
		equipment: new GridLayout( rect(px(352,39), px(652,239)), px(6, 4), InventorySlot ),
		features: new GridLayout( rect(px(657,18), px(729,243)), px(1, 5), RegularButton ),
	},
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
			idle:px(0,0), regular:px(1,0), strong:px(2,0), parry:px(3,0), piercing:px(4,0), ultimate:px(5,0),
			block:px(0,1), defBuff:px(1,1), heal:px(2,1), offBuff:px(3,1), charge:px(4,1), ultBuff:px(5,1),
			locked:px(0,2), regen:px(1,2), locked:px(2,2), locked:px(3,2), locked:px(4,2), move69:px(5,2),
		}),
		self: {
			hpBar: new Bar( rect(px(317,399), px(547,424)) ),
		},
		enemy: {
			hpBar: new Bar( rect(px(705,399), px(935,424)) ),
		},
		bossDetector: new PixelDetector( px(715,278), new Palette([[0xf7ef29ff, true]], false) ),
	},
	inv: {
		inventory: grids.inventory.inventory.createAll(),

		equip: grids.equipment.equipment.createObj({
			acc: [px(2,0), px(2,1), px(2,2), px(2,3), px(1,3)],
			head:px(3,0), chest:px(3,1), weapon:px(4,1), legs:px(3,2), shoes:px(3,3),
		}),
		cube: grids.equipment.equipment.createWidget( px(5,1) ),
		trash: grids.equipment.equipment.createWidget( px(5,3) ),
		feats: grids.equipment.features.createObj({
			wtf:0, itemList:1, daycare:2, fragments:3, statsBreakdown:4,
		}),
	}
};


Object.assign( module.exports, ngu );
