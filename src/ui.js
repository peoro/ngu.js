
// UI for virtual input
const ui = module.exports;

const css = require('./index.scss'); // CSS (both for UI and GUI

class UI {
	constructor() {
		while( document.getElementById(`nguJsDiv`) ) {
			console.warn( `Found an instance of NGU.js still installed, uhm...` );
			document.getElementById(`nguJsDiv`).remove();
		}

		const div = this.div = document.createElement(`div`);
		div.id = `nguJsDiv`;
		document.body.appendChild( div );

		// events received on our widget shouldn't propagate to the canvas beneath
		[`mousemove`, `mousedown`, `mouseup`, `keydown`, `keypress`, `keyup`].forEach( (eventName)=>{
			div.addEventListener( eventName, (e)=>{ e.stopPropagation(); });
		});

		// applying our stylesheet
		const style = this.style = document.createElement(`style`);
		style.type = 'text/css';
		style.appendChild( document.createTextNode(css) );
		div.appendChild( style ); // NOTE(peoro): a <style> in a <div> is not standard, but it works
	}
	destroy() {
		this.div.remove();
	}
}

class UIElement {
	constructor( className='point' ) {
		this.div = document.createElement(`div`);
		this.restyle( className );
	}
	restyle( className ) {
		this.div.className = className;
	}
	show( ui ) { ui.div.appendChild(this.div); }
	hide() { this.div.remove(); }
}

class Point extends UIElement {
	constructor( className='point' ) {
		super( className );
	}
	move( {x,y} ) {
		const style = this.div.style;
		style.left = `${x}px`;
		style.top = `${y}px`;
	}
}
class Rect extends UIElement {
	constructor( className='rect' ) {
		super( className );
	}
	set( rect ) {
		const style = this.div.style;
		style.left = `${rect.left}px`;
		style.top = `${rect.top}px`;
		style.width = `${rect.width}px`;
		style.height = `${rect.height}px`;
	}
}


// adding debug methods to `util.Pixel` and `util.Rect`
const util = require('./util.js');

util.Pixel.prototype.debug = async function( s=2 ) {
	const el = new Point('debug-point');
	el.move( this );
	el.show( nguJs.ui );
	await util.wait( s );
	el.hide();
};

util.Rect.prototype.debug = async function( s=2 ) {
	const el = new Rect('debug-rect');
	el.set( this );
	el.show( nguJs.ui );
	await util.wait( s );
	el.hide();
};


Object.assign( ui, {
	UI,
	UIElement,
	Point,
	Rect,
});
