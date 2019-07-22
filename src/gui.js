
const {loadNguJs} = require('./loader.js');
const {implementTyping} = require('./fixes.js');

const noop = ()=>{};
function createElement( parent, tag, opts={}, fn=noop ) {
	if( fn === noop && typeof opts === "function" ) {
		fn = opts;
		opts = {};
	}

	const el = document.createElement( tag );
	Object.assign( el, opts );
	fn( el );
	parent.appendChild( el );
	return el;
}
function createTextNode( parent, text ) {
	parent.appendChild( document.createTextNode(text) );
}

class Gui {
	constructor( nguJs ) {
		this.nguJs = nguJs;

		const {div} = nguJs.ui;

		createElement( div, `button`, {textContent:`.js`, className:`ngu-js-button`} );

		createElement( div, `div`, {className:`ngu-js-window`}, (controlDiv)=>{
			// this div hides as soon as the mouse leaves NGU.js GUI
			controlDiv.style.visibility = `hidden`;
			div.addEventListener( `mouseenter`, ()=>{ controlDiv.style.visibility = `visible`; } );
			div.addEventListener( `mouseleave`, ()=>{ controlDiv.style.visibility = `hidden`; } );

			// let's add a `dev` logo, if necessary
			if( DEV ) {
				createElement( controlDiv, `span`, {className:`dev`, textContent:`dev`} );
			}

			// let's display what's the loop currently active (and a button to disable it)
			createElement( controlDiv, `p`, (p)=>{
				createTextNode( p, `Current loop: ` );

				createElement( p, `span`, {textContent:`none`}, (span)=>{
					div.addEventListener( `nguJs.loop`, (e)=>{
						span.textContent = e.detail || `none`;
						stopSpan.style.visibility = e.detail ? `visible` : `hidden`;
					});
				});

				const stopSpan = createElement( p, `span`, (stopSpan)=>{
					stopSpan.style.visibility = `hidden`;

					createTextNode( stopSpan, ` — ` );
					createElement( stopSpan, `a`, {textContent:`stop`, href:`javascript:void nguJs.loopRunner.stop();`} );
				});
			});

			// loop buttons
			const mkA = (textContent, href)=>{
				createElement( controlDiv, `a`, {className:`loop`, textContent, href} );
			};
			mkA( `Merge everything`, `javascript:void nguJs.loops.fixInv();` );
			mkA( `Snipe boss`, `javascript:void nguJs.loops.snipeBoss();` );
			mkA( `Snipe boss and merge everything`, `javascript:void nguJs.loops.mainLoop();` );

			// reload NGU.js form
			createElement( controlDiv, `form`, {className:`reload`}, (form)=>{
				const input = createElement( form, `input`, {type:`text`, placeholder:localStorage.getItem('nguJsBasePath')}, implementTyping );

				createElement( form, `button`, {type:`submit`, textContent:`reload`} );

				form.addEventListener( `submit`, (event)=>{
					const value = input.value || input.placeholder;

					console.log( `Reloading`, value );
					loadNguJs( value );

					event.preventDefault();
					return false;
				});
			});
		});
	}
}

Object.assign( module.exports, {
	Gui,
});
