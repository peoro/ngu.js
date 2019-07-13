
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

module.exports = {
	mkEvent,
	Mouse,
	Keyboard,
};
