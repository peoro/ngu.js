
// This module exports anything related to colors.
// Functions to manipulate or process colors (represented as a 32 bits: 8 per RGBA channel), and abstractions to interpret the color of a pixel.
// `PixelDetector` is an abstraction to understand what's something on the screen based on the color of a pixel, and the ColorMaps

function colorToRGB( color ) {
	const [r, g, b] = [
		(color >> 24) & 0xff,
		(color >> 16) & 0xff,
		(color >>  8) & 0xff,
	];
	return {r,g,b};
}
function colorToGray( color ) {
	const {r,g,b} = colorToRGB( color );
	return (r+g+b) / 3 / 0xFF;
}


/*
// ColorMap can tell you what a color represnts
interface ColorMap {
	get: color -> value
}
*/

// A ColorMap that can recognize a set of colors
class Palette {
	constructor( colorMapArr, defaultValue ) {
		this.colorMap = new Map( colorMapArr );
		this.defaultValue = defaultValue;
	}

	toString() {
		const defaultStr = this.defaultValue === undefined ? `` : `, ${this.defaultValue}`;
		return `Palette{${this.colorMap}${defaultStr}}`;
	}
	get( color ) {
		const value = this.colorMap.get( color );
		if( value !== undefined ) {
			return value;
		}

		if( this.defaultValue === undefined ) {
			console.error( `Found a pixel of unexpected color #${color.toString(16)} in ${this}` );
		}
		return this.defaultValue;
	}
}

// A ColorMap that can recognize whether a color is dark or bright
class BrightnessThreshold {
	constructor( dark, bright, threshold=.5 ) {
		Object.assign( this, {dark, bright, threshold} );
	}

	get( color ) {
		return colorToGray(color) > this.threshold ? this.bright : this.dark;
	}
}


// A class defining on which pixel a color map is actually useful
// It can be made relative to some point on the screen. This is especially useful when the pixel detector represents a pixel within a widget that could be placed anywhere.
// NOTE: the `io` module implements a `detect :: framebuffer -> value` method for this type.
class PixelDetector {
	constructor( offset, colorMap ) {
		Object.assign( this, {offset, colorMap} );
	}

	relativeTo( p ) {
		return new PixelDetector( this.offset.clone().add(p), this.colorMap );
	}
}


Object.assign( module.exports, {
	colorToRGB, colorToGray,
	Palette, BrightnessThreshold,
	PixelDetector
});
