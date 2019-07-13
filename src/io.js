
// generic IO functions (not specific to NGU or any game)

const {px} = require('./util.js');
const ui = require('./ui.js');

const mkEvent = (EvType, eventName, data)=>{
	return new EvType( eventName, Object.assign({
		view: window,
		bubbles: true,
		cancelable: true,
	}, data) );
};

// let's draw an UI Point where the mouse is
const vMouse = new ui.Point( {color:`red`} );
vMouse.show();

const mouse = {
	p: px( 0, 0 ),
	ui: vMouse,

	sendEvent( eventName, data={} ) {
		const {x, y} = this.p;
		const element = document.elementFromPoint( x, y );
		const event = mkEvent( MouseEvent, eventName, Object.assign({clientX:x, clientY:y}, data) );
		element.dispatchEvent( event );
	},
	move( p ) {
		this.p.copy( p );
		this.ui.move( p );

		return this.sendEvent( `mousemove` );
	},
	down( button=0 ) { return this.sendEvent(`mousedown`, {button}); },
	up( button=0 ) { return this.sendEvent(`mouseup`, {button}); },
	async click( button=0 ) {
		// return this.sendEvent( `click`, {button} );
		await this.down( button );
		await this.up( button );
	},
};

const keyboard = {
	sendEvent( eventName, key, data={} ) {
		const keyCode = key.toUpperCase().charCodeAt(0);
		// console.log( `Pressing key ${key} ${keyCode}` );
		const event = mkEvent( KeyboardEvent, eventName, Object.assign({
			// code: `TODO`,
			code: `KeyD`,
			key,
			keyCode,
			which: keyCode,
		}, data) );
		window.dispatchEvent( event );
	},
	down( key ) { return this.sendEvent(`keydown`, key); },
	up( key ) { return this.sendEvent(`keyup`, key); },
	async press( key ) {
		await this.down( key );
		await this.up( key );
	},
};

module.exports = {
	mkEvent,
	focus: ()=>window.dispatchEvent( mkEvent(FocusEvent, `focus`) ),
	mouse,
	keyboard,
};
