
// generic IO functions (not specific to NGU or any game)

const {px} = require('./util.js');
const {Point, Rect} = require('./ui.js');


// input part: sending emulated input events
// NOTE(peoro): NGU processes input events with the following priority:
// 1. move the mouse to the latest position
// 2. read all mouse click events (only one per button though!)
// 3. read the first key pressed
//
// This means that if during a single frame the mouse is moved several times, multiple keys are pressed and multiple mouse buttons click:
// - first, NGU moves the mouse to the latest location our mouse moved to
// - then, NGU processes all the mouse buttons that have been clicked
// - at last, NGU processes the first key that has been pressed
//
// TODO(peoro): figure out what happens with different combinations of mouse/key down or up...
//
// Given the above, we'll use the following (suboptimal, but simple) state machine to decide whether to send input immediately, or to wait for the next frame:
// states:
// - NO_INPUT: no input of any kind has been sent during the current frame
// - MOUSE_MOVE: mousemove has been requested
// - MOUSE_DOWN(button): mousedown has been requested on `button`
// - CLICK: mouseup has been requested
// - KEY_DOWN(key): keydown has been requested on `key`
// - KEYPRESS: a key has been pressed
// we can only move from a state to one strictly lower in the list, and from `MOUSE_DOWN` to `CLICK` or from `KEY_DOWN` to `KEYPRESS` only if the button/key is the same

const mkEvent = (EvType, eventName, data)=>{
	return new EvType( eventName, Object.assign({
		view: window,
		bubbles: true,
		cancelable: true,
	}, data) );
};

class IO {
	constructor( gameCanvas, ui ) {
		this.state = new IO.State( this );
		this.animationHandle = null;
		this.nextFrame = null;

		this.mouse = new Mouse( this, gameCanvas, ui );
		this.keyboard = new Keyboard( this );
		this.framebuffer = new Framebuffer( gameCanvas );

		const waitForNextFrame = ()=>{
			return this.nextFrame = new Promise( (resolve,reject)=>{
				this.animationHandle = window.requestAnimationFrame( ()=>{
					waitForNextFrame();
					resolve();
				});
			});
		};
		waitForNextFrame();
	}
	log( ...args ) {
		// console.log( ...args );
	}
	toState( newState ) { return this.state.toState( newState ); }
	// NOTE(peoro): `sync` doesn't work properly... `await this.sync()` usually returns before the latest input request is done sending its event. Not sure why; promise branching doesn't guarantee any call ordering or what?
	// because of that, `sync()` always wait one extra, unnecessary frame...
	async sync() {
		const state = await this.state.latestInputRequest;
		await state.nextFrame;
		console.assert( this.state.commandsToProcess === 0, `somehow sync didn't catch up with all the commands` );
	}
	destroy() { window.cancelAnimationFrame( this.animationHandle ); }
}
IO.State = class IOState {
	constructor( io ) {
		this.io = io;

		// a promise that is resolved when the latest input event has been executed
		// it returns the state as it's left by the latest input event
		this.latestInputRequest = Promise.resolve({
			state: IO.states.noInput,
			nextFrame: Promise.resolve(),
		});
		this.commandsToProcess = 0;
	}

	async toState( newState ) {
		++ this.commandsToProcess;
		return this.latestInputRequest = (async ()=>{
			const state = await this.latestInputRequest; // waiting for the latest input event requseted so far

			// waiting a whole frame after the previous request, if necessary
			//console.log( state, `->`, newState, `need to wait?`, this.needToWait(state, newState) );
			if( this.needToWait(state, newState) ) {
				await state.nextFrame;
			}

			-- this.commandsToProcess;
			// let's return the state we're leaving the system in
			return Object.assign( {}, newState, {
				nextFrame: this.io.nextFrame,
			});
		})();
	}

	needToWait( state, newState ) {
		if( newState.state <= state.state ) {
			return true;
		}

		if( newState.state === IO.states.click && state.state === IO.states.mouseDown && newState.button !== state.button ) {
			return true;
		}

		if( newState.state === IO.states.keyPress && state.state === IO.states.keyDown && newState.key !== state.key ) {
			return true;
		}

		return false;
	}
};
IO.states = {
	noInput: 0,
	mouseMove: 1,
	mouseDown: 2,
	click: 3,
	keyDown: 4,
	keyPress: 5,
};

// TODO(peoro): currently it's important to `await` every io function and be careful to put short pauses after each call... Let's change this module so that input functions can be called synchronously: they just keep track of the current input sequence (e.g. using a singleton promise that keeps getting replaced) and execute it all with the correct pauses (i.e. waiting for animation frames between pieces of input that need to be broken apart, like mouse moves). Then awaiting on a single synchronization function at the end will be enough.

class Mouse {
	constructor( io, target, ui ) {
		this.io = io;
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
		const event = mkEvent( window.MouseEvent, eventName, Object.assign({clientX:x, clientY:y}, data) );
		element.dispatchEvent( event );
	}
	async move( p ) {
		await this.io.toState( {state:IO.states.mouseMove, p} );

		this.p.copy( p );
		if( this.vMouse ) {
			this.vMouse.move( p );
		}
		this.io.log( `mouse move ${p}` );
		return this.sendEvent( `mousemove` );
	}
	async down( button=0 ) {
		await this.io.toState( {state:IO.states.mouseDown, button} );
		this.io.log( `mouse down ${button}` );
		return this.sendEvent(`mousedown`, {button});
	}
	async up( button=0 ) {
		await this.io.toState( {state:IO.states.click, button} );
		this.io.log( `mouse up ${button}` );
		return this.sendEvent(`mouseup`, {button});
	}
	click( button=0 ) {
		// return this.sendEvent( `click`, {button} );
		this.down( button );
		return this.up( button );
	}
}

class Keyboard {
	constructor( io ) {
		this.io = io;
	}
	sendEvent( eventName, {code, key, keyCode}, data={} ) {
		const event = mkEvent( window.KeyboardEvent, eventName, Object.assign({
			code,
			key,
			keyCode,
			which: keyCode,
		}, data) );
		window.dispatchEvent( event );
	}
	async down( key ) {
		await this.io.toState( {state:IO.states.keyDown, key} );
		return this.sendEvent(`keydown`, key);
	}
	async up( key ) {
		await this.io.toState( {state:IO.states.keyPress, key} );
		return this.sendEvent(`keyup`, key);
	}
	async press( key ) {
		this.down( key );
		return this.up( key );
	}
};
Keyboard.keys = {
	d: {code:'KeyD', key:'d', keyCode:68},
	leftArrow: {keyCode:37},
	upArrow: {keyCode:38},
	rightArrow: {keyCode:39},
	downArrow: {keyCode:40},
};


// output part: reading information from the canvas

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
		console.assert( p.hasOwnProperty('x') && p.hasOwnProperty('y'), `${p} not a px...` );
		return new Promise( (resolve,reject)=>{
			requestAnimationFrame( ()=>{
				const {gl} = this;
				// TODO(peoro): why is `y-1` needed? is it always needed? what's going on?
				gl.readPixels( p.x, H-p.y-1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(buffer), offset*4 );
				resolve( new DataView(buffer).getUint32(offset*4, false) ); // should we `>>8` it?
			});
		});
	}
}

module.exports = {
	mkEvent,
	IO,
	Mouse,
	Keyboard,
	Framebuffer,
};
