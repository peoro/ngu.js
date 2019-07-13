
// UI for virtual input

const ui = module.exports;

class UI {
	constructor() {
		console.assert( ! document.getElementById(`nguJsDiv`) );

		const div = this.div = document.createElement(`div`);
		div.id = `nguJsDiv`;
		document.body.appendChild( div );
	}
	destroy() {
		this.div.remove();
	}
}

class Point {
	constructor( style ) {
		this.point = document.createElement(`div`);
		this.restyle( style );
	}
	restyle( {size=10, color=`green`}={} ) {
		// setting point style
		const style = this.point.style;
		style.width = `${size}px`;
		style.height = `${size}px`;
		style.boxSizing = `border-box`;
		style.border = `solid ${color} 1px`;
		style.borderRadius = `${size/2}px`;
		style.boxShadow = `inset 0 0 ${size/2}px ${color}, 0 0 ${size/2}px ${color}`;
		style.padding = `0`;
		style.margin = `-${size/2}px`;

		style.position = `absolute`;
		style.top = 0;
		style.left = 0;
		style.zIndex = 1000;
		style.pointerEvents = `none`;
	}
	show( ui ) { ui.div.appendChild(this.point); }
	hide() { this.point.remove(); }
	move( {x,y} ) {
		const style = this.point.style;
		style.left = `${x}px`;
		style.top = `${y}px`;
	}
}
class Rect {
	constructor( style ) {
		this.point = document.createElement(`div`);
		this.restyle( style );
	}
	restyle( {size=10, color=`green`}={} ) {
		// setting point style
		const style = this.point.style;
		style.width = `${size}px`;
		style.height = `${size}px`;
		style.boxSizing = `border-box`;
		style.border = `solid ${color} 1px`;
		style.boxShadow = `inset 0 0 5px ${color}, 0 0 5px ${color}`;
		style.padding = `0`;

		style.position = `absolute`;
		style.zIndex = 1000;
		style.pointerEvents = `none`;
	}
	show( ui ) { ui.div.appendChild(this.point); }
	hide() { this.point.remove(); }
	set( rect ) {
		const style = this.point.style;
		style.left = `${rect.left}px`;
		style.top = `${rect.top}px`;
		style.width = `${rect.width}px`;
		style.height = `${rect.height}px`;
	}
}

Object.assign( ui, {
	UI,
	Point,
	Rect,
});
