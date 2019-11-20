
const {px, rectS} = require('./util.js');
const {loadNguJs} = require('./loader.js');
const {implementTyping} = require('./fixes.js');
const {imageDataToURL, hash} = require('./util.js');
const {ImageView, ImageDataView} = require('./image.js');
const assets = require('./assets.js');

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
			if( process.env.DEV ) {
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
							const imgData = new ImageView( nguJs.io.framebuffer, slot.innerRect ).toImageData();
							createElement( invDiv, `a`, {download:`x.png`, href:imageDataToURL(imgData)}, a=>{
								createElement( a, `img`, {
									src: imageDataToURL(imgData),
									title: assets.items.detect(imgData.data),
									imgData,
								});
							});
						});
					}
				});

				mkA( `Compute item lookup table`, ()=>{
					const {missing, count, hashItemListImg} = assets.items;

					const imgs = Array.from( invDiv.childNodes );
					const hashes = imgs.map( hashItemListImg );
					console.assert( hashes.slice(0, count).every( (hash)=>hash !== missing) );
					console.assert( hashes.slice(count).every( (hash)=>hash === missing) );

					const items = hashes.slice( 0, count );
					console.log( JSON.stringify(items, null, `\t`) );
					console.log( `Unknown: "${hashes[hashes.length-1]}"` );
					assets.items.items.splice( 0, items.length, ...items );
				});

				mkA( `Get slot items`, async ()=>{
					nguJs.logic.inv.goTo();
					await nguJs.loopRunner.sync( true );

					clearElement( invDiv );
					nguJsLib.ngu.inv.inventory.forEach( (slot)=>{
						const imgData = new ImageView( nguJs.io.framebuffer, slot.innerRect ).toImageData();
						createElement( invDiv, `img`, {
							src: imageDataToURL(imgData),
							title: assets.items.detect(imgData.data),
							imgData,
						});
					});
				});

				mkA( `Cube to PNG`, async ()=>{
					nguJs.logic.inv.goTo();
					await nguJs.loopRunner.sync( true );

					const imgData = new ImageView( nguJs.io.framebuffer, nguJsLib.ngu.inv.cube.innerRect ).toImageData();
					const png = assets.items.toPNG( imgData );
				});

				mkA( `Item list to PNG`, async ()=>{
					const {logic, io, loopRunner} = nguJs;
					const {ngu} = nguJsLib;
					const {pages} = ngu.itemList;

					const itemSize = nguJsLib.ngu.itemList.items[0].innerRect.size;
					const pageCount = ngu.grids.inventory.itemList.items.count;
					console.log( `${itemSize}x${pageCount}x${pages.length}` );

					await loopRunner.stop();
					logic.inv.goTo();
					logic.click( ngu.inv.feats.itemList );
					logic.click( ngu.itemList.clear );
					logic.click( ngu.itemList.clearDialog.yes );

					clearElement( invDiv );

					for( let i = 0; i < pages.length; ++i ) {
						logic.click( pages[i] );
						await loopRunner.sync( true );

						const targetSize = itemSize.clone().multiply(pageCount);
						const targetImgData = new ImageData( targetSize.x, targetSize.y );
						const targetView = new ImageDataView( targetImgData );

						console.log( `Target: ${targetSize}` );

						nguJsLib.ngu.itemList.items.forEach( (slot, i)=>{
							const src = new ImageView( nguJs.io.framebuffer, slot.innerRect );

							const targetPos = px( i%pageCount.x, Math.floor(i/pageCount.x) );
							const targetRect = rectS( targetPos.multiply(itemSize), itemSize );
							const target = new ImageView( targetView, targetRect );

							console.log( `${slot.innerRect} => ${targetRect}` );

							src.copyTo( target );
						});

						createElement( invDiv, `img`, {
							src: imageDataToURL(targetImgData),
						});
					}
				});

				//const invDiv = createElement( contentDiv, `div` );
				// TODO: debugging only: let's reuse the same invDiv among reloads...
				const invDiv = window.invDiv =
					( window.invDiv && (contentDiv.appendChild(window.invDiv), window.invDiv) ) ||
					createElement( contentDiv, `div` );
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
