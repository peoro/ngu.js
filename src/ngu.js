
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
		buttons: [/*filled in later*/],
	},
	adv: {
		moves: {
			count: px( 6, 3 ),
			// OCD(peoro): the yellow boxes are all different sizes D:
			// besides, it can't divided by `count` DDD:
			area: rect(px(313,85), px(945,194)),
			move( col, row ) {
				const {count, area} = this;
				console.assert( col >= 0 && col < count.x && row >= 0 && row < count.y, `Invalid move index ${col}x${row}` );

				const size = px( area.width/count.x, area.height/count.y );
				const topLeft = px( area.left + size.x*col, area.top + size.y*row ).ceil();
				return rect( topLeft, topLeft.clone().add(size.floor()) );
			},
		},
		self: {
			hpBar: rect(px(317,399), px(547,424)),
		},
		enemy: {
			hpBar: rect(px(705,399), px(935,424)),
		},
	},
	inv: {
		// TODO(peoro): move into `inv.slots` or something
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
		},
		equip: {
			cube: rect( px(602,89), px(652,139) ),
		},
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
// TODO(peoro): do the same as for the moves - actually abstract this logic into a function
// filling in coords.feat buttons:
for( let featName in feats ) {
	const idx = feats[featName];
	coords.feat.buttons[idx] = coords.feat.button( idx );
}

const moves = {
	idle:px(0,0), regular:px(1,0), strong:px(2,0), parry:px(3,0), piercing:px(4,0), ultimate:px(5,0),
	block:px(0,1), defBuff:px(1,1), heal:px(2,1), offBuff:px(3,1), charge:px(4,1), ultBuff:px(5,1),
	locked:px(0,2), regen:px(1,2), locked:px(2,2), locked:px(3,2), locked:px(4,2), move69:px(5,2),
};
// filling in coords.adv.moves.move values:
// TODO(peoro): it'd be cool to have an array[move], map<name,move>, map<index,move>
// TODO(peoro): the function `coords.adv.moves.move` should be embedded here
for( let moveName in moves ) {
	const index = moves[moveName];
	const rect = coords.adv.moves.move( index.x, index.y );
	const px = rect.center;
	coords.adv.moves.move[moveName] = {name:moveName, index, rect, px};
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


class PixelColor {
	constructor( name, offset, colorMap ) {
		Object.assign( this, {name, offset, colorMap} );
	}

	get( color ) {
		const value = this.colorMap( color );
		if( value === undefined ) {
			console.warn( `${this.name}: found a pixel of unexpected color #${color.toString(16)}` );
		}
		return value;
	}
}

function palette( colorMapArr, defaultValue ) {
	const colorMap = new Map( colorMapArr );
	return function( color ) {
		const value = colorMap.get( color );
		return value === undefined ? defaultValue : value;
	};
}
function toDarkness( color ) {
	const [r, g, b] = [
		(color >> 24) & 0xff,
		(color >> 16) & 0xff,
		(color >>  8) & 0xff,
	];
	return (r+g+b)/3/0xFF;
}
function brighterThan( c ) { return (color)=>c < toDarkness(color); }
function darkerThan( c ) { return (color)=>c > toDarkness(color); }

const colors = {
	adv: {
		moveActive: new PixelColor( `moveActive`, px(2,2), palette([
			[0xffeb04ff, true],
			[0xc7c4c7ff, false],
		]), `moveActive` ),
		moveState: new PixelColor( `moveState`, px(9,8), palette([
			[0xf89b9bff, `ready`], // rows 1
			[0x7c4e4eff, `unavailable`], // rows 1
			[0x6687a3ff, `ready`], // row 2
			[0x334452ff, `unavailable`], // row 2
			[0xc39494ff, `ready`], // row 3
			[0x624a4aff, `unavailable`], // row 3
		]), `moveState` ),
		boss: new PixelColor( `boss`, px(715, 278), palette([[0xf7ef29ff, true]], false) ),

		// the following might be unreliable
		enemyAlive: new PixelColor( `enemyAlive`, px(706, 411), darkerThan(.7) ),
		ownHpRatioAtLeast( ratio ) {
			const hpBar = coords.adv.self.hpBar;
			const x = Math.round( hpBar.left+1 + ratio*(hpBar.width-2) );
			const y = hpBar.top+1;
			return new PixelColor( `enemyAlive`, px(x,y), darkerThan(.7) );
		}
	},
};


module.exports = {
	coords,
	feats,
	colors,
};
