
const {px, rectS} = require('./util.js');


class ImageDataView {
	constructor( imageData ) {
		this.imageData = imageData;
		this.dataView = new DataView( this.imageData.data.buffer );
	}

	get size() {
		const {width, height} = this.imageData;
		return px(width, height);
	}
	get rect() { return rectS( px(0,0), this.size ); }

	getOffset( p ) {
		const {width, height} = this.imageData;
		return p.x + p.y*width;
	}
	getPixel( p ) {
		console.assert( p.isInteger(), `${p} not an integer size...` );
		return this.dataView.getUint32( this.getOffset(p)*4, false );
	}
	setPixel( p, color ) {
		console.assert( p.isInteger(), `${p} not an integer size...` );
		return this.dataView.setUint32( this.getOffset(p)*4, color, false );
	}
}

class ImageView {
	constructor( fb, rect ) {
		Object.assign( this, {fb, rect} );
	}

	get size() {
		const {width, height} = this.rect;
		return px(width, height);
	}

	pxToSrc( p ) { return p.clone().add( this.rect.topLeft ); }
	getOffset( p ) { return this.fb.getOffset( this.pxToSrc(p) ); }
	getPixel( p ) { return this.fb.getPixel( this.pxToSrc(p) ); }
	setPixel( p, color ) { return this.fb.setPixel( this.pxToSrc(p), color ); }

	toImageData() {
		const {fb, rect} = this;
		const {width, height} = rect;
		const imgData = new ImageData( width, height );
		const {data} = imgData;

		// copying the data from the framebuffer image into `data`
		// NOTE(peoro): if this needs optimization, we can use...
		// - TypedArray.prototype.subarray()
		// - TypedArray.prototype.set()
		// to copy the image view line by line
		rect.forEach( (p)=>{
			p.sub( rect.topLeft );

			const srcOffset = this.getOffset( p );
			const dstOffset = p.x + p.y*width;
			for( let i = 0; i < 4; ++i ) {
				data[ dstOffset*4+i ] = fb.dataView.getUint8( srcOffset*4+i );
			}
		});

		return imgData
	}
	copyTo( imageView ) {
		console.assert( imageView.size.eq( this.size ), `${this.rect} <=> ${imageView.rect}: size mismatch` );
		const rect = rectS( px(0,0), this.size );
		rect.forEach( (p)=>{
			//console.log( `${p}: ${this.getOffset(p)} -> ${imageView.getOffset(p)} [${imageView.fb.rect}]` );
			imageView.setPixel( p, this.getPixel(p) );
		});
	}
	/*
	toImage() {
		const {fb, rect} = this;
		const img = document.createElement(`img`);

		const imgData = this.toImageData(){;
		tmpCanvas.width = imgData.width;
		tmpCanvas.height = imgData.height;
		tmpCtx.putImageData( imgData, 0, 0 );
		img.src = tmpCanvas.toDataURL();

		return img;
	}
	*/
}

Object.assign( module.exports, {
	ImageView, ImageDataView
});
