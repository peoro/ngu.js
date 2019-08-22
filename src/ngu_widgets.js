
// This module provides an abstraction to the widgets used by NGU (e.g. bars, buttons, items, ...).
// The actual widgets are instantiated in `ngu.js`.

const {Pixel, px, Rect} = require('./util.js');
const {PixelDetector, Palette, BrightnessThreshold} = require('./color.js');

// TODO: hmmm, not sure what's the best way to do this...
// We want a dict, but we want it to be iterable too... And not all the values must have a key (see `createAll`)...
class WidgetList extends Array {
}


// NGU widgets
class Widget {
	constructor( rect ) {
		this.rect = rect;
	}

	get center() { return this.rect.center; }
}


class GridLayout extends Widget{
	constructor( rect, count, ButtonType ) {
		super( rect );
		Object.assign( this, {count, ButtonType} );

		this.items = [];
		this.itemDict = {};
	}

	posToIdx( pos ) { return pos.x + pos.y*this.count.x; }
	idxToPos( n ) { return px( n%this.count.x, Math.floor(n/this.count.x) ); }
	computeItemRect( pos ) {
		const {count, rect} = this;
		console.assert( pos.x >= 0 && pos.x < count.x && pos.y >= 0 && pos.y < count.y, `Invalid item pos ${pos.x}x${pos.y}` );

		const size = px( rect.width/count.x, rect.height/count.y );
		const topLeft = px( rect.left + size.x*pos.x, rect.top + size.y*pos.y ).ceil();
		return new Rect( topLeft, topLeft.clone().add(size.floor()) );
	}

	createWidget( p ) {
		if( this.ButtonType.new ) {
			// using widget's custom constructor
			return this.ButtonType.new( this, p );
		}
		else {
			const pos = p instanceof Pixel ? p : this.idxToPos(p);
			return new this.ButtonType( this.computeItemRect(pos) );
		}
	}
	createWidgets( arr ) {
		// TODO(peoro): instead of using `n` here to look for the widget in the grid, pass the grid (`this`) as well as `n` to the widget constructor, so that it can be handled the way the widget prefers it
		return arr.map( (n)=>this.createWidget(n) );
	}
	createObj( obj ) {
		const result = new WidgetList();
		for( let key in obj ) {
			const val = obj[key];
			result[key] = Array.isArray(val) ? this.createWidgets(val) : this.createWidget(val);
		}
		return result;
	}
	createAll() {
		const result = new WidgetList();
		for( let row = 0; row < this.count.y; ++row ) {
			for( let col = 0; col < this.count.x; ++col ) {
				result.push( this.createWidget( px(col,row) ) );
			}
		}
		return result;
	}
}


class Bar extends Widget {
	constructor( rect ) { super(rect); }

	getInsideRect() {
		const {topLeft, bottomRight} = this.rect;
		const {top, left, right} = this.constructor;
		return Rect.fromCorners( topLeft.clone().add(px(left,top)), bottomRight.clone().add(px(right,top)) );
	}
	getStateDetectorForRatio( ratio ) {
		console.assert( ratio >= 0 && ratio <= 1, `Bar ratio must be between 0 and 1, ${ratio} not valid` );
		const {topLeft, topRight} = this.getInsideRect();
		return this.constructor.barDetector.relativeTo( topLeft.lerp(topRight, ratio) );
	}
}
Bar.top = 1; Bar.left = 2; Bar.right = -2;
Bar.barDetector = new PixelDetector( px(0,0), new BrightnessThreshold(true, false) );

class RegularButton extends Widget {
	constructor( rect ) { super(rect); }
}
//???Button.stateDetector = new PixelDetector( px(5,5), new Palette([
//]);

class MoveButton extends RegularButton {
	static new( moveGrid, {i, key} ) {
		const rect = moveGrid.computeItemRect( moveGrid.idxToPos(i) );
		return new MoveButton( rect, key );
	}

	constructor( rect, key ) {
		super(rect);
		this.key = key;
	}

	toString() { return this.key; }

	get activeDetector() { return this.constructor.activeDetector.relativeTo(this.rect.topLeft); }
	get stateDetector() { return this.constructor.stateDetector.relativeTo(this.rect.topLeft); }
}
MoveButton.activeDetector = new PixelDetector( px(1,1), new Palette([
	[0xffeb04ff, true],
	[0xc7c4c7ff, false],
]) );
// the move state color fades bewtween `ready` and `unavailable`, thus the intermediate values would give us issues...
MoveButton.stateDetector = new PixelDetector( px(8,8), new Palette([
	[0xf89b9bff, `ready`], // rows 1
	// [0x7c4e4eff, `unavailable`], // rows 1
	[0x6687a3ff, `ready`], // row 2
	// [0x334452ff, `unavailable`], // row 2
	[0xc39494ff, `ready`], // row 3
	// [0x624a4aff, `unavailable`], // row 3
], `unavailable`) );


class ItemSlot extends Widget {
	constructor( rect ) {
		console.assert( rect.width === 50 && rect.height === 50, `Weirdly sized item slot: ${rect}` );
		super( rect );
	}

	get innerRect() {
		const {left, top} = this.rect;
		return new Rect( px(left+2,top+2), px(left+48,top+48) );
	}
	get stateDetector() { return this.constructor.stateDetector.relativeTo(this.rect.topLeft); }
}

class InventorySlot extends ItemSlot {
	constructor( rect ) { super(rect); }
}
InventorySlot.stateDetector = new PixelDetector( px(0,0), new Palette([
	[0xb68855ff, {}], // slot not unlocked
	[0xffffffff, {exists:true,}],
	[0xff0505ff, {exists:true, protected:true,}],
	[0x000505ff, {exists:true, automerge:true,}],
	[0x820582ff, {exists:true, protected:true, automerge:true,}],
]) );

class ItemListSlot extends ItemSlot {
	constructor( rect ) { super(rect); }
}
ItemListSlot.stateDetector = new PixelDetector( px(0,0), new Palette([
	[0xff0505ff, `maxxed`],
	[0xffffffff, `normal`],
]) );



Object.assign( module.exports, {
	WidgetList,
	Widget,
	GridLayout,
	Bar,
	RegularButton, MoveButton,
	ItemSlot, InventorySlot, ItemListSlot
});
