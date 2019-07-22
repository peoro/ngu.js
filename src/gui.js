
const {loadNguJs} = require('./loader.js');

class Gui {
	constructor( nguJs ) {
		this.nguJs = nguJs;

		const {div} = nguJs.ui;

		// events received on this widget shouldn't propagate to the canvas beneath
		div.addEventListener( `mousemove`, (e)=>{ e.stopPropagation(); });
		div.addEventListener( `mousedown`, (e)=>{ e.stopPropagation(); });
		div.addEventListener( `mouseup`, (e)=>{ e.stopPropagation(); });

		div.addEventListener( `keydown`, (e)=>{ e.stopPropagation(); } );
		div.addEventListener( `keypress`, (e)=>{ e.stopPropagation(); });
		div.addEventListener( `keyup`, (e)=>{ e.stopPropagation(); });

		const nguJsButton = document.createElement('button');
		nguJsButton.textContent = `.js`;
		const style = nguJsButton.style;
		{
			style.position = `absolute`;
			style.left = `11px`;
			style.top = `558px`;
			style.width = `38px`;
			style.height = `30px`;
			style.pointerEvents = `auto`;
			style.boxSizing = `border-box`;
			style.backgroundColor = `white`;
	    style.borderRadius = `5px`;
	    style.border = `2px solid black`;
			style.zIndex = 10000;
			div.appendChild( nguJsButton );
		}

		const controlDiv = document.createElement('div');
		{
			const style = controlDiv.style;
			style.visibility = `hidden`;
			style.position = `absolute`;
			style.left = `11px`;
			style.top = `42px`;
			style.width = `880px`;
			style.height = `546px`;
			style.pointerEvents = `auto`;
			style.boxSizing = `border-box`;
			style.backgroundColor = `white`;
	    style.borderRadius = `5px`;
	    style.border = `2px solid black`;
	    style.opacity = .95;
			style.padding = `10px`;
			style.zIndex = 5000;

			const currentLoopP = document.createElement('p');
			{
				currentLoopP.textContent = `Current loop: `
				const currentLoopSpan = document.createElement('span');
				{
					currentLoopSpan.textContent = `none`;
					div.addEventListener( `nguJs.loop`, (e)=>{
						currentLoopSpan.textContent = e.detail || `none`;
					});
					currentLoopP.appendChild( currentLoopSpan );
				}
				controlDiv.appendChild( currentLoopP );
			}

			const stopA = document.createElement('a');
			{
				stopA.textContent = `Stop loop`;
				stopA.href = `javascript:void nguJs.loopRunner.stop();`;
				stopA.style.display = `block`;
				controlDiv.appendChild( stopA );
			}

			const applyAllA = document.createElement('a');
			{
				const a = applyAllA;
				a.textContent = `Fix inventory`;
				a.href = `javascript:void nguJs.loops.fixInv();`;
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const fightA = document.createElement('a');
			{
				const a = fightA;
				a.textContent = `Snipe boss`;
				a.href = `javascript:void nguJs.loops.snipeBoss();`;
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const mainLoopA = document.createElement('a');
			{
				const a = mainLoopA;
				a.textContent = `Snipe bosses and fix inventory`;
				a.href = `javascript:void nguJs.loops.mainLoop();`;
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const loadNguForm = document.createElement('form');
			{
				const form = loadNguForm;

				const input = document.createElement('input');
				{
					input.type = `text`;
					input.id = `ngujs-basepath`;
					input.placeholder = localStorage.getItem('nguJsBasePath');
					form.appendChild( input );
				}

				const submit = document.createElement('button');
				{
					submit.type = `submit`;
					submit.textContent = `reload`;
					form.appendChild( submit );
				}

				form.addEventListener( `submit`, (event)=>{
					const value = input.value || input.placeholder;

					console.log( `reloading:`, value );
					loadNguJs( value );

					event.preventDefault();
					return false;
				});

				controlDiv.appendChild( form );

				// implementing our own typing function in the keydown handler
				// unfortunately NGU calls `window.addEventListener('keypress', f, {capture:true, passive:true});`
				// and within such handler it stops the event propagation: the input fields won't ever receive keypress events, which are the ones used to implement typing.

				input.addEventListener( `keydown`, (e)=>{
					// TODO(peoro): why this is not working? O,o MDN describes it...
					//
					//const char = e.char;
					//if( ! char ) { return; }

					const char = e.key; // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
					if( char.length !== 1 || e.ctrlKey ) { return; }

					const {value} = input;

					const pre = value.slice( 0, input.selectionStart );
					const post = value.slice( input.selectionEnd );

					input.value = `${pre}${char}${post}`;

					const selection = pre.length + char.length;
					input.setSelectionRange( selection, selection );
				});
			}

			div.appendChild( controlDiv );
		}

		div.addEventListener( `mouseenter`, ()=>{ controlDiv.style.visibility = `visible`; } );
		div.addEventListener( `mouseleave`, ()=>{ controlDiv.style.visibility = `hidden`; } );
	}
}

Object.assign( module.exports, {
	Gui,
});
