
// geometry stuff
class Pixel {
	constructor( x=0, y=0 ) {
		Object.assign( this, {x,y} );
	}
	toString() { return `px(${this.x},${this.y})`; }
	copy( px2 ) {
		const {x, y} = px2;
		Object.assign( this, {x,y} );
	}
	clone() { return new Pixel( this.x ,this.y ); }
	map( fn ) { this.x = fn(this.x); this.y = fn(this.y); return this; }
	zip( px2, fn ) { this.x = fn(this.x, px2.x); this.y = fn(this.y, px2.y); return this; }
	every( fn ) { return fn(this.x) && fn(this.y); }
	add( px2 ) { return this.zip( px2, (a,b)=>a+b ); }
	sub( px2 ) { return this.zip( px2, (a,b)=>a-b ); }
	multiply( px2 ) { return this.zip( px2, (a,b)=>a*b ); }
	divide( px2 ) { return this.zip( px2, (a,b)=>a/b ); }
	multiplyScalar( c ) { return this.map( n=>n*c ); }
	lerp( px2, c ) { return this.add( px2.clone().sub(this).multiplyScalar(c) ); }
	floor() { return this.map( Math.floor ); }
	round() { return this.map( Math.round ); }
	ceil() { return this.map( Math.ceil ); }
}
const px = (x,y)=>new Pixel( x, y );

class Rect {
	static fromRect( rect ) {
		return new Rect( px(rect.left, rect.top), px(rect.right, rect.bottom) );
	}
	static fromTLSize( topLeft, size ) {
		return new Rect( topLeft.clone(), topLeft.clone().add(size) );
	}
	static fromCorners( topLeft, bottomRight ) {
		return new Rect( topLeft, bottomRight );
	}
	constructor( topLeft, bottomRight ) {
		Object.assign( this, {topLeft, bottomRight} );
	}
	get left() { return this.topLeft.x; }
	get right() { return this.bottomRight.x; }
	get top() { return this.topLeft.y; }
	get bottom() { return this.bottomRight.y; }
	get topRight() { return px(this.right, this.top); }
	get bottomLeft() { return px(this.left, this.bottom); }
	get center() { return px( (this.left + this.right)/2, (this.top + this.bottom)/2 ); };
	get width() { return this.right - this.left; }
	get height() { return this.bottom - this.top; }
	get size() { return px(this.width, this.height); }

	toString() { return `rect(${this.topLeft}, ${this.bottomRight})`; }
	copy( rect2 ) {
		this.topLeft.copy( rect2.topLeft );
		this.bottomRight.copy( rect2.bottomRight );
	}
	clone() { return Rect.fromRect(this); }
	forEach( fn ) {
		const {top, bottom, left, right} = this;
		for( let y = top; y < bottom; ++y ) {
			for( let x = left; x < right; ++x ) {
				fn( px(x, y) );
			}
		}
	}
	shrinkBy( rect2 ) {
		this.topLeft.add( rect2.topLeft );
		this.bottomRight.sub( rect2.bottomRight );
		return this;
	}
	add( rect2 ) {
		this.topLeft.add( rect2.topLeft );
		this.bottomRight.add( rect2.bottomRight );
		return this;
	}
}
const rect = (tl, br)=>new Rect( tl, br );

// extra stuff
function wait( sec=0.03 ) {
	return new Promise( (resolve, reject)=>setTimeout(resolve, sec*1000) );
};

async function seq( fns ) {
	for( let fn of fns ) {
		await fn();
	}
};

function timeSec() {
	return performance.now() / 1000;
}

function withTimeout( promise, s=3 ) {
	const timeout = new Promise( (resolve, reject)=>{
		const handle = setTimeout( ()=>{
			clearTimeout( handle );
			reject(`Timeout on a promise after ${s}s`);
		}, s*1000 );
	});

	return Promise.race( [promise, timeout] );
}

const tmpCanvas = document.createElement('canvas');
const tmpCtx = tmpCanvas.getContext('2d');
function imageDataToURL( imgData ) {
	const canvas = tmpCanvas
	canvas.width = imgData.width;
	canvas.height = imgData.height;

	const ctx = tmpCtx;
	ctx.putImageData( imgData, 0, 0 );

	return canvas.toDataURL();
}

module.exports = {
	Pixel, px,
	Rect, rect,
	wait,
	seq,
	timeSec,
	withTimeout,
	imageDataToURL,
};
