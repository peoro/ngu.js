
// NGU stuff

const {px, Rect, rect} = require('./util.js');

const W = 960, H = 600;

// coordinates (relative to a canvas of size `WxH`)
const coords = {
	size: px( W, H ),
	main: {
		settings: rect(px(11,528), px(49,558)),
	},
	feat: {
		bar: rect( px(176,30), px(290,523) ),
		count: 17,
		button( n ) {
			const {bar, count} = this;
			console.assert( n >= 0 && n < count, `Invalid feature index ${n}` );

			const buttonSize = px( bar.width, bar.height/count );
			const corner = px( bar.left, bar.top + buttonSize.y*n );
			return rect( corner, corner.clone().add(buttonSize) );
		},
		buttons: [/* filled in later*/],
	},
	equip: {
		cube: rect( px(602,89), px(652,139) ),
	},
	inv: {
		gridSize: px( 12, 5 ),
		slotSize: px( 50, 50 ),
		slotArea: rect( px(326, 304), px(926, 554) ),
		slot( column, row ) {
			const {slotArea, gridSize} = this;
			console.assert( column >= 0 && column < gridSize.x && row >= 0 && row < gridSize.y, `Invalid slot index ${column}x${row}` );

			const slotSize = slotArea.size.clone().divide( gridSize );
			const slotCorner = px( column, row )
				.multiply( slotSize )
				.add( slotArea.topLeft );

			return rect( slotCorner, slotCorner.clone().add(slotSize) );
		}
	}
};

const feats = {
	bt: 0,
	boss: 1,
	pit: 2,
	adv: 3,
	inv: 4,
	aug: 5,
	at: 6,
	tm: 7,
	bm: 8,
	wand: 9,
	ngu: 10,
	ygg: 11,
	gd: 12,
	bp: 13,
};

// filling in coords.feat buttons:
for( let featName in feats ) {
	const idx = feats[featName];
	coords.feat.buttons[idx] = coords.feat.button( idx );
}

// adding inv slots
coords.inv.pageSlots = [];
for( let row = 0; row < 5; ++row ) {
	for( let col = 0; col < 12; ++col ) {
		const rect = coords.inv.slot( col, row );
		const px = rect.center;
		coords.inv.pageSlots.push( {row, col, rect, px} );
	}
}

module.exports = {
	coords,
	feats,
};
