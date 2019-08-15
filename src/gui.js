
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
function clearElement( el ) {
	while( el.firstChild ) {
		el.removeChild( el.firstChild );
	}
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
						stopSpan.style.visibility = e.detail ? `inherit` : `hidden`;
					});
				});

				const stopSpan = createElement( p, `span`, (stopSpan)=>{
					stopSpan.style.visibility = `hidden`;

					createTextNode( stopSpan, ` — ` );
					createElement( stopSpan, `a`, {textContent:`stop`, href:`javascript:void nguJs.loopRunner.stop();`} );
				});
			});

			// loop buttons
			const mkA = (textContent, fn)=>{
				createElement( controlDiv, `a`, {className:`loop`, href:`javascript:void 0;`, textContent}, (a)=>{
					// TODO(peoro): place a single event listener on the whole `controlDiv` that routes events
					a.addEventListener( `click`, fn );
				});
			};
			mkA( `Merge everything`, ()=>{ nguJs.loops.fixInv(); } );
			mkA( `Snipe boss`, ()=>{ nguJs.loops.snipeBoss(); } );
			mkA( `Snipe boss and merge everything`, ()=>{ nguJs.loops.snipeLoop(); } );
			mkA( `Kill all`, ()=>{ nguJs.loops.killAll(); } );
			mkA( `Kill all and merge everything`, ()=>{ nguJs.loops.killAllLoop(); } );

			mkA( `Get slot items`, async ()=>{
				clearElement( invDiv );
				nguJs.logic.inv.goTo();
				await nguJs.loopRunner.sync( true ); // TODO(peoro): move `sync` outside of `loops`...
				nguJsLib.ngu.inv.inventory.forEach( (slot)=>{
					const img = nguJs.io.framebuffer.getView( slot.innerRect ).toImage();
					invDiv.appendChild( img );
				});
			});
			const invDiv = createElement( controlDiv, `div` );

			/*
			try {
				requestAnimationFrame( ()=>{
					const img = nguJs.io.framebuffer.getView( nguJsLib.ngu.coords.inv.equip.cube ).toImage();
					controlDiv.appendChild( img );
				}, 0 );
			} catch( err ) {
				console.warn( `Couldn't load img D:` );
				console.error( err );
			}
			*/

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
