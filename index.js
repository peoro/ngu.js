
(()=>{

	const uninstall = ()=>{
		if( window.peoros ) {
			try {
				window.peoros.logic.stop();
			} catch(e) {}
		}

		// removing old div, if any
		const div = document.getElementById( `peorosDiv` );
		if( div ) { div.remove(); }
	}
	uninstall();

	{
		const gameCanvas = document.getElementById( '#canvas' );
		if( ! gameCanvas ) {
			console.log( `%cCouldn't find the game canvas!`, `color:red; font-size:x-large;` );
			console.log( `%cMake sure that the game has loaded, and that you're pasting this code into "gameiframe" (in the dropdown menu of this JavaScript console - by default it reads "top")`, `color:red;` );
			return;
		}
	}


	// our namespace (very original D: )
	const peoros = window.peoros = {
		uninstall,
	};

	const evaluate = (fn)=>fn();

	peoros.util = evaluate(()=>{
		// geometry stuff
		class Pixel {
			constructor( x=0, y=0 ) {
				Object.assign( this, {x,y} );
			}
			toString() { return `px(${this.x},${this.y})`; }
			copy( px1 ) {
				const {x, y} = px1;
				Object.assign( this, {x,y} );
			}
			clone() {
				return new Pixel( this.x ,this.y );
			}
			add( px2 ) { this.x += px2.x; this.y += px2.y; return this; }
			sub( px2 ) { this.x -= px2.x; this.y -= px2.y; return this; }
			multiply( px2 ) { this.x *= px2.x; this.y *= px2.y; return this; }
			divide( px2 ) { this.x /= px2.x; this.y /= px2.y; return this; }
		}
		const px = (x,y)=>new Pixel( x, y );

		class Rect {
			static fromRect( rect ) {
				return new Rect( px(rect.left, rect.top), px(rect.right, rect.bottom) );
			}
			constructor( topLeft, bottomRight ) {
				Object.assign( this, {topLeft, bottomRight} );
			}
			toString() { return `rect(${this.topLeft}, ${this.bottomRight})`; }
			get left() { return this.topLeft.x; }
			get right() { return this.bottomRight.x; }
			get top() { return this.topLeft.y; }
			get bottom() { return this.bottomRight.y; }
			get center() { return px( (this.left + this.right)/2, (this.top + this.bottom)/2 ); };
			get width() { return this.right - this.left; }
			get height() { return this.bottom - this.top; }
			get size() { return px(this.width, this.height); }
		}
		const rect = (tl, br)=>new Rect( tl, br );

		// extra stuff
		const wait = (sec)=>{
			return new Promise( (resolve, reject)=>setTimeout(resolve, sec*1000) );
		};

		return {
			Pixel, px,
			Rect, rect,
			wait,
		};
	});

	// UI for virtual input
	peoros.ui = evaluate(()=>{
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

		return{
			div,
			Point,
			Rect,
		};
	});

	// generic IO functions (not specific to NGU or any game)
	peoros.io = evaluate(()=>{
		const mkEvent = (EvType, eventName, data)=>{
			return new EvType( eventName, Object.assign({
				view: window,
				bubbles: true,
				cancelable: true,
			}, data) );
		};

		// let's draw an UI Point where the mouse is
		const vMouse = new peoros.ui.Point( {color:`red`} );
		vMouse.show();

		const mouse = {
			p: peoros.util.px( 0, 0 ),
			ui: vMouse,

			sendEvent( eventName, data={} ) {
				const {x, y} = this.p;
				const element = document.elementFromPoint( x, y );
				const event = mkEvent( MouseEvent, eventName, Object.assign({clientX:x, clientY:y}, data) );
				element.dispatchEvent( event );
			},
			move( p ) {
				this.p.copy( p );
				this.ui.move( p );

				return this.sendEvent( `mousemove` );
			},
			down( button=0 ) { return this.sendEvent(`mousedown`, {button}); },
			up( button=0 ) { return this.sendEvent(`mouseup`, {button}); },
			async click( button=0 ) {
				// return this.sendEvent( `click`, {button} );
				await this.down( button );
				await this.up( button );
			},
		};

		const keyboard = {
			sendEvent( eventName, key, data={} ) {
				const keyCode = key.toUpperCase().charCodeAt(0);
				// console.log( `Pressing key ${key} ${keyCode}` );
				const event = mkEvent( KeyboardEvent, eventName, Object.assign({
					// code: `TODO`,
					code: `KeyD`,
					key,
					keyCode,
					which: keyCode,
				}, data) );
				window.dispatchEvent( event );
			},
			down( key ) { return this.sendEvent(`keydown`, key); },
			up( key ) { return this.sendEvent(`keyup`, key); },
			async press( key ) {
				await this.down( key );
				await this.up( key );
			},
		};

		return {
			mkEvent,
			focus: ()=>window.dispatchEvent( mkEvent(FocusEvent, `focus`) ),
			mouse,
			keyboard,
		};
	});

	// NGU stuff
	peoros.ngu = evaluate(()=>{
		// coordinates are relative to this size
		const {px, Rect, rect} = peoros.util;

		const gameCanvas = document.getElementById( '#canvas' );
		const canvasRect = Rect.fromRect( gameCanvas.getBoundingClientRect() );

		// coordinates
		const coords = {
			size: px( 960, 600 ),
			feat: {
				bar: rect( px(176,30), px(290,523) ),
				count: 17,
				button( n ) {
					const {bar, count} = this;
					console.assert( n >= 0 && n < count, `Invalid feature index ${n}` );

					const buttonSize = px( bar.width, bar.height/count );
					const corner = px( bar.left, bar.top + buttonSize.y*n );
					return rect( corner, corner.clone().add(buttonSize) );
				},
				get bt() { return this.button(0); },
				get boss() { return this.button(1); },
				get pit() { return this.button(2); },
				get adv() { return this.button(3); },
				get inv() { return this.button(4); },
			},
			equip: {
				cube: rect( px(602,89), px(652,139) ),
			},
			inv: {
				gridSize: px( 12, 5 ),
				slotSize: px( 50, 50 ),
				slotArea: rect( px(326, 304), px(926, 554) ),
				slot( column, row ) {
					const {slotArea, gridSize} = this;
					console.assert( column >= 0 && column < gridSize.x && row >= 0 && row < gridSize.y, `Invalid slot index ${column}x${row}` );

					const slotSize = slotArea.size.clone().divide( gridSize );
					const slotCorner = px( column, row )
						.multiply( slotSize )
						.add( slotArea.topLeft );

					return rect( slotCorner, slotCorner.clone().add(slotSize) );
				}
			}
		};

		return {
			coords,
			async debug( coord, s=3 ) {
				let el;

				// point
				if( coord.hasOwnProperty('x') ) {
					el = new peoros.ui.Point( {size:7} );
					el.move( coord );
					el.show();
				}
				// rect
				if( coord.hasOwnProperty('topLeft') ) {
					el = new peoros.ui.Rect();
					el.set( coord );
					el.show();
				}

				await peoros.util.wait( s );
				el.hide();
			},
		};
	});

	peoros.logic = evaluate(()=>{
		const {mouse, keyboard} = peoros.io;
		const {coords} = peoros.ngu;

		return {
			currentRule: null,
			shouldStop: false,

			wait( s ) {
				if( this.shouldStop ) { throw `stop`; }
				return peoros.util.wait( s );
			},
			async runRule( ruleName, fn ) {
				console.assert( ! this.currentRule, `Trying to start ${ruleName} while ${this.currentRule
				} is running` );

				this.currentRule = ruleName;
				this.shouldStop = false;
				try {
					await fn();
				} catch( err ) {
					if( err != `stop` ) {
						throw err;
					}
				}
				this.currentRule = null;
				window.dispatchEvent( new Event(`peoros.logic.stopped`) );
			},
			awaitRule() {
				return new Promise( (resolve, reject)=>
					window.addEventListener( `peoros.logic.stopped`, ()=>{
						resolve();
					}, {once:true} )
				);
			},
			stop() {
				if( this.currentRule ) {
					this.shouldStop = true;
					return this.awaitRule();
				}
			},

			async toFeat( feature ) {
				await mouse.move( feature.center );
				await mouse.click();
			},
			async mergeSlot( col, row ) {
				await mouse.move( coords.inv.slot(col, row).center );
				await keyboard.press( 'd' );
			},
			async applyAllBoostsToCube() {
				await mouse.move( coords.equip.cube.center );
				await mouse.click( 2 );
			},
			async mergeLoop( {pause=.5}={} ) {
				return this.runRule( `mergeLoop`, async()=>{
					while( true ) {
						// focus lost if you click outside the game
						await peoros.io.focus();
						await this.toFeat( coords.feat.inv );
						await this.wait( pause/10 );

						for( let row = 0; row < 5; ++row ) {
							for( let col = 0; col < 12; ++col ) {
								await this.applyAllBoostsToCube();
								await this.wait( pause/10 );
								await this.mergeSlot( col, row );
								await this.wait( pause );
							}
						}
					}
				});
			},
		};
	});


	{
		const comment = (str)=>console.log( `%c// ${str}`, `color:Green;` );
		const code = (str)=>console.log( `%c${str}`, `font-family: monospace;` );
		const space = ()=>console.log();

		comment(`To start hacking with this:`);
		code(`var {px, rect} = peoros.util;`);
		space();
		comment(`Draw a point or a rect for debugging:`);
		code(`peoros.ngu.debug( peoros.ngu.coords.inv.slot(5,2) );
peoros.ngu.debug( peoros.ngu.coords.inv.slot(5,2).center );
peoros.ngu.coords.inv.slot(5,2).toString();`);
		space();
		comment(`Start high level pieces of logic:`);
		code(`peoros.io.focus();
peoros.logic.applyAllBoostsToCube();
peoros.logic.mergeLoop();`);
		space();
		comment(`Stop them`);
		code(`peoros.logic.stop();`);
		space();
		comment(`To uninstall:`);
		code(`peoros.uninstall();`);
	}

})();
