
// geometry stuff
class Pixel {
	constructor( x=0, y=0 ) {
		Object.assign( this, {x,y} );
	}
	toString() { return `px(${this.x},${this.y})`; }
	copy( px1 ) {
		const {x, y} = px1;
		Object.assign( this, {x,y} );
	}
	clone() {
		return new Pixel( this.x ,this.y );
	}
	add( px2 ) { this.x += px2.x; this.y += px2.y; return this; }
	sub( px2 ) { this.x -= px2.x; this.y -= px2.y; return this; }
	multiply( px2 ) { this.x *= px2.x; this.y *= px2.y; return this; }
	divide( px2 ) { this.x /= px2.x; this.y /= px2.y; return this; }
}
const px = (x,y)=>new Pixel( x, y );

class Rect {
	static fromRect( rect ) {
		return new Rect( px(rect.left, rect.top), px(rect.right, rect.bottom) );
	}
	constructor( topLeft, bottomRight ) {
		Object.assign( this, {topLeft, bottomRight} );
	}
	toString() { return `rect(${this.topLeft}, ${this.bottomRight})`; }
	get left() { return this.topLeft.x; }
	get right() { return this.bottomRight.x; }
	get top() { return this.topLeft.y; }
	get bottom() { return this.bottomRight.y; }
	get center() { return px( (this.left + this.right)/2, (this.top + this.bottom)/2 ); };
	get width() { return this.right - this.left; }
	get height() { return this.bottom - this.top; }
	get size() { return px(this.width, this.height); }
}
const rect = (tl, br)=>new Rect( tl, br );

// extra stuff
function wait( sec=0 ) {
	return new Promise( (resolve, reject)=>setTimeout(resolve, sec*1000) );
};

async function seq( fns ) {
	for( let fn of fns ) {
		await fn();
	}
};

module.exports = {
	Pixel, px,
	Rect, rect,
	wait,
	seq,
};
