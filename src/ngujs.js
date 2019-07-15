
const {wait} = require('./util.js');
const ui = require('./ui.js');
const {IO, Mouse, Keyboard, mkEvent} = require('./io.js');
const {Logic} = require('./logic.js');
const {LoopRunner} = require('./loops.js');
const {Gui} = require('./gui.js');

class NguJs {
	constructor( gameCanvas ) {
		this.ui = new ui.UI();

		/*
		this.io = {
			mouse: new Mouse( gameCanvas, this.ui ),
			keyboard: new Keyboard(),
			framebuffer: new Framebuffer( gameCanvas ),
		}
		*/
		this.io = new IO( gameCanvas, this.ui );

		this.logic = new Logic( this.io );
		this.loopRunner = new LoopRunner();
		this.loops = this.loopRunner.loops( this );

		this.gui = new Gui( this );

		window.addEventListener( 'blur', this.focus );
	}
	focus() {
		// console.log( `focus!` );
		window.dispatchEvent( mkEvent(FocusEvent, `focus`) );
	}
	async debug( coord, s=3 ) {
		let el;
		// point
		if( coord.hasOwnProperty('x') ) {
			el = new ui.Point( {size:7} );
			el.move( coord );
			el.show( this.ui );
		}
		// rect
		if( coord.hasOwnProperty('topLeft') ) {
			el = new ui.Rect();
			el.set( coord );
			el.show( this.ui );
		}

		await wait( s );
		el.hide();
	}

	async destroy() {
		window.removeEventListener( 'blur', this.focus );
		this.ui.destroy();
		await this.loopRunner.stop();
	}
}

Object.assign( module.exports, {NguJs} );
