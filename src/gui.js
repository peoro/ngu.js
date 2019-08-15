
const {loadNguJs} = require('./loader.js');
const {implementTyping} = require('./fixes.js');
const {imageDataToURL} = require('./util.js');

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

		createElement( div, `div`, {className:`ngu-js-window`, tabIndex:0}, (controlDiv)=>{
			// this div hides as soon as the mouse leaves NGU.js GUI
			controlDiv.style.visibility = `hidden`;
			const show = ()=>{
				controlDiv.style.visibility = `visible`;
				controlDiv.focus();
			};
			const hide = ()=>{ controlDiv.style.visibility = `hidden`; };

			div.addEventListener( `mouseenter`, show );
			div.addEventListener( `mouseleave`, hide );
			div.addEventListener( `keydown`, (event)=>{
				if( event.key === `Escape` ) { hide(); }
			});

			// let's add a `dev` logo, if necessary
			if( DEV ) {
				createElement( controlDiv, `span`, {className:`dev`, textContent:`dev`} );
			}

			createElement( controlDiv, `div`, {className:`content`}, (contentDiv)=>{

				// let's display what's the loop currently active (and a button to disable it)
				createElement( contentDiv, `p`, (p)=>{
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
					createElement( contentDiv, `a`, {className:`loop`, href:`javascript:void 0;`, textContent}, (a)=>{
						// TODO(peoro): place a single event listener on the whole `contentDiv` that routes events
						a.addEventListener( `click`, fn );
					});
				};
				mkA( `Merge everything`, ()=>{ nguJs.loops.fixInv(); } );
				mkA( `Snipe boss`, ()=>{ nguJs.loops.snipeBoss(); } );
				mkA( `Snipe boss and merge everything`, ()=>{ nguJs.loops.snipeLoop(); } );
				mkA( `Kill all`, ()=>{ nguJs.loops.killAll(); } );
				mkA( `Kill all and merge everything`, ()=>{ nguJs.loops.killAllLoop(); } );
				mkA( `Fetch item lookup table`, async ()=>{
					const {logic, io, loopRunner} = nguJs;
					const {ngu} = nguJsLib;
					const {pages} = ngu.itemList;

					await loopRunner.stop();
					logic.inv.goTo();
					logic.click( ngu.inv.feats.itemList );
					logic.click( ngu.itemList.clear );
					logic.click( ngu.itemList.clearDialog.yes );

					clearElement( invDiv );

					for( let i = 0; i < pages.length; ++i ) {
						logic.click( pages[i] );
						await loopRunner.sync( true );

						nguJsLib.ngu.itemList.items.forEach( (slot)=>{
							// const img = nguJs.io.framebuffer.getView( slot.innerRect ).toImage();
							const imgData = nguJs.io.framebuffer.getView( slot.innerRect ).toImageData();
							createElement( invDiv, `img`, {src:imageDataToURL(imgData), imgData} );
							// invDiv.appendChild( img );
						});
					}
				});

				mkA( `Compute item lookup table`, ()=>{
					const imgs = Array.from( invDiv.childNodes );
					imgs.forEach( (img, i)=>{

					});
				});

				/*
				mkA( `Get slot items`, async ()=>{
					clearElement( invDiv );
					nguJs.logic.inv.goTo();
					await nguJs.loopRunner.sync( true );
					nguJsLib.ngu.inv.inventory.forEach( (slot)=>{
						const img = nguJs.io.framebuffer.getView( slot.innerRect ).toImage();
						invDiv.appendChild( img );
					});
				});
				*/

				//const invDiv = createElement( contentDiv, `div` );
				// TODO: debugging only: let's reuse the same invDiv among reloads...
				const invDiv = window.invDiv =
					( window.invDiv && (contentDiv.appendChild(window.invDiv), window.invDiv) ) ||
					createElement( contentDiv, `div` );

				/*
				try {
					requestAnimationFrame( ()=>{
						const img = nguJs.io.framebuffer.getView( nguJsLib.ngu.coords.inv.equip.cube ).toImage();
						contentDiv.appendChild( img );
					}, 0 );
				} catch( err ) {
					console.warn( `Couldn't load img D:` );
					console.error( err );
				}
				*/
			});

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
