
class Gui {
	constructor( nguJs ) {
		this.nguJs = nguJs;

		const {div} = nguJs.ui;

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
				applyAllA.textContent = `Merge loop`;
				applyAllA.href = `javascript:void nguJs.loops.mergeLoop();`;
				applyAllA.style.display = `block`;
				controlDiv.appendChild( applyAllA );
			}

			div.appendChild( controlDiv );
		}

		div.addEventListener( `mouseenter`, ()=>{
			controlDiv.style.visibility = `visible`;
		});
		div.addEventListener( `mouseleave`, ()=>{
			console.log( `leave` );
			controlDiv.style.visibility = `hidden`;
		});
	}
}

Object.assign( module.exports, {
	Gui,
});
