
// UI for virtual input

// creating new div
const div = document.createElement(`div`);
{
	div.id = `peorosDiv`;

	// setting point style
	const style = div.style;
	style.pointerEvents = `none`;

	document.body.appendChild( div );
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
	show() { div.appendChild(this.point); }
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
	show() { div.appendChild(this.point); }
	hide() { this.point.remove(); }
	set( rect ) {
		const style = this.point.style;
		style.left = `${rect.left}px`;
		style.top = `${rect.top}px`;
		style.width = `${rect.width}px`;
		style.height = `${rect.height}px`;
	}
}

module.exports = {
	div,
	Point,
	Rect,
};
