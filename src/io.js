
// generic IO functions (not specific to NGU or any game)

const {px} = require('./util.js');
const {Point, Rect} = require('./ui.js');

const mkEvent = (EvType, eventName, data)=>{
	return new EvType( eventName, Object.assign({
		view: window,
		bubbles: true,
		cancelable: true,
	}, data) );
};

// TODO(peoro): currently it's important to `await` every io function and be careful to put short pauses after each call... Let's change this module so that input functions can be called synchronously: they just keep track of the current input sequence (e.g. using a singleton promise that keeps getting replaced) and execute it all with the correct pauses (i.e. waiting for animation frames between pieces of input that need to be broken apart, like mouse moves). Then awaiting on a single synchronization function at the end will be enough.

class Mouse {
	constructor( target, ui ) {
		this.target = target;
		this.p = px( 0, 0 );

		if( ui ) {
			const vMouse = new Point( {color:`red`} );
			vMouse.show( ui );
			this.vMouse = vMouse;
		}
	}
	sendEvent( eventName, data={} ) {
		const {x, y} = this.p;
		const element = this.target || document.elementFromPoint(x, y);
		const event = mkEvent( MouseEvent, eventName, Object.assign({clientX:x, clientY:y}, data) );
		element.dispatchEvent( event );
	}
	move( p ) {
		this.p.copy( p );
		this.vMouse.move( p );

		return this.sendEvent( `mousemove` );
	}
	down( button=0 ) { return this.sendEvent(`mousedown`, {button}); }
	up( button=0 ) { return this.sendEvent(`mouseup`, {button}); }
	async click( button=0 ) {
		// return this.sendEvent( `click`, {button} );
		await this.down( button );
		await this.up( button );
	}
}

class Keyboard {
	sendEvent( eventName, key, data={} ) {
		const keyCode = key.toUpperCase().charCodeAt(0);

		const event = mkEvent( KeyboardEvent, eventName, Object.assign({
			// code: `TODO`,
			code: `KeyD`,
			key,
			keyCode,
			which: keyCode,
		}, data) );
		window.dispatchEvent( event );
	}
	down( key ) { return this.sendEvent(`keydown`, key); }
	up( key ) { return this.sendEvent(`keyup`, key); }
	async press( key ) {
		await this.down( key );
		await this.up( key );
	}
};

const W = 960, H = 600;

class Framebuffer {
	constructor( canvas ) {
		console.assert( canvas.width === W && canvas.height === H, `Framebuffer is currently meant to only work with ${W}x${H} canvases (canvas is ${canvas.width}x${canvas.height})` );

		this.buffer = new ArrayBuffer( 4*W*H );
		this.gl = canvas.getContext('webgl2');
	}

	// TODO(peoro): instead of querying the canvas for specific pixels one by one, it's probably better (way easier, and not too bad performance-wise) to grab the whole canvas every frame and work with that synchronously

	getPixels( rect ) {
		return new Promise( (resolve,reject)=>{
			requestAnimationFrame( ()=>{
				const {gl} = this;
				gl.readPixels( rect.left, H-rect.top, rect.width, rect.height, gl.RGBA, gl.UNSIGNED_BYTE, this.u8arr );

				// TODO(peoro): maybe, instead of downloading the image to the CPU, we could work with the image in GPU memory directly... Like writing a shader to hash an image on the screen. Such an optimization is probably unnecessary, but it'd be interesting
				// TODO(peoro): `Uint32Array` doesn't work for our purpose on little-endian systems (e.g. x86 :/ ), and working with `Uint8Array` is uncomfortable... We should create some classes that use DataView to somehow abstract away pixel format (and maybe the fact that it's a 2D pixel array).
				// TODO(peoro): can't we get rid of the alpha channel? hmmm, don't love working with 0xRRGGBBAA pixels... should we do `>>8` every pixel?
				// TODO(peoro): How can we pass similar buffers to CV or OCR libraries btw?

				// resolve( new Uint32Array(this.u8arr.buffer, 0, rect.width*rect.height) )
				resolve( new Uint8Array(this.u8arr.buffer, 0, 4*rect.width*rect.height) );
			});
		});
	}
	getPixel( p, {buffer=new ArrayBuffer(4), offset=0}={} ) {
		return new Promise( (resolve,reject)=>{
			requestAnimationFrame( ()=>{
				const {gl} = this;
				gl.readPixels( p.x, H-p.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(buffer), offset*4 );
				resolve( new DataView(buffer).getUint32(offset*4, false) ); // should we `>>8` it?
			});
		});
	}
}

module.exports = {
	mkEvent,
	Mouse,
	Keyboard,
	Framebuffer,
};
