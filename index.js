
(()=>{
	
	const bbToRect = ({left, top, right, bottom})=>{
		return { left, top, right, bottom, width:right-left, height:bottom-top };
	};
	

	const createVMousePointer = function() {
		let vMousePointer = document.getElementById( 'vMousePointer' );
		if( ! vMousePointer ) {
			vMousePointer = document.createElement(`div`);
			vMousePointer.id = `vMousePointer`;
		}
		
		const size = 10;
		
		const style = vMousePointer.style;
		style.width = `${size}px`;
		style.height = `${size}px`;
		style.boxSizing = `border-box`;
		style.border = `solid red 1px`;
		style.borderRadius = `${size/2}px`;
		style.boxShadow = `inset 0 0 ${size/2}px red, 0 0 ${size/2}px red`;
		style.padding = `0`;
		style.margin = `-${size/2}px`;
		
		style.position = `absolute`;
		style.top = 0;
		style.left = 0;
		style.zIndex = 1000;
		style.pointerEvents = `none`;
		
		document.body.appendChild( vMousePointer );
		return vMousePointer;
	}
	const vMousePointer = createVMousePointer();
	
	const moveVMousePointer = function( x, y ) {
		vMousePointer.style.left = `${x}px`;
		vMousePointer.style.top = `${y}px`;
	}
	
	/*
	document.addEventListener( 'mousemove', (e)=>{
		moveVMousePointer( e.pageX, e.pageY );
	});
	
	console.log( vMousePointer );
	})()
	*/
	
	
	
	const gameCanvas = document.getElementById( '#canvas' );
	
	const getBB = function( canvas=gameCanvas ) {
		return canvas.getBoundingClientRect();
	}

	
	const mouse = {x:0, y:0};
	
	const moveMouse = function( x, y ) {
		mouse.x = x;
		mouse.y = y;
		
		moveVMousePointer( x, y );
		
		const element = document.elementFromPoint( x, y );

		const event = new MouseEvent("mousemove", {
			view: window,
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y
		});

		//console.log( `Sending`, event, `to`, element );
		element.dispatchEvent( event );
	}
	const click = function() {
		/*
		const event = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
			button: 0,
			clientX: mouse.x,
			clientY: mouse.y
		});
		gameCanvas.dispatchEvent( event );
		*/

		gameCanvas.dispatchEvent( new MouseEvent("mousedown", {
			view: window,
			bubbles: true,
			cancelable: true,
			button: 0,
			clientX: mouse.x,
			clientY: mouse.y
		}) );

		gameCanvas.dispatchEvent( new MouseEvent("mouseup", {
			view: window,
			bubbles: true,
			cancelable: true,
			button: 0,
			clientX: mouse.x,
			clientY: mouse.y
		}) );
	}
	
	const key = function( key ) {
		window.dispatchEvent( new KeyboardEvent("keydown", {
			view: window,
			bubbles: true,
			cancelable: true,
			code: 'KeyD',
			key: 'd',
			keyCode: 68,
			which: 68,
		}) );
		
		window.dispatchEvent( new KeyboardEvent("keyup", {
			view: window,
			bubbles: true,
			cancelable: true,
			code: 'KeyD',
			key: 'd',
			keyCode: 68,
			which: 68,
		}) );
	}

	const moveAlongDiagonal = function( i, {step=1, ms=20}={} ) {
		if( i >= 1 ) {
			console.log( `done` );
			return;
		}
		
		const bb = getBB();
		const x = i*(bb.right - bb.left) + bb.left;
		const y = i*(bb.bottom - bb.top) + bb.top;
		moveMouse( x, y );
		
		setTimeout( ()=>moveAlongDiagonal(i+step, {step,ms}), ms );
	}

	// setTimeout( ()=>moveAlongDiagonal(0, 1000, {step:10, ms:16}), 1000 );
	// console.log( getBB() );
	setTimeout( ()=>moveAlongDiagonal(0, {step:.05, ms:16}), 1000 );
	
	
	// NOTE:
	// feature bar: .18 -> .3 // center: .25
	// inventory slots: .34,.51 -> .96,.92   ||   

	window.peoroNGU = {
		focus() {
			window.dispatchEvent( new Event('focus', {view:window, bubbles:true, cancelable:true}) );
		},
 
		mouseTo( x, y ) {
			const bb = getBB();
			moveMouse( x*(bb.right - bb.left) + bb.left, y*(bb.bottom - bb.top) + bb.top );
		},
 
		toInvSlot( column, row ) {
			console.assert( column >= 0 && column < 12 && row >= 0 && row < 5, `Invalid slot index ${column}x${row}` )
			
			const rect = bbToRect( {top:.51, bottom:.92, left:.34, right:.96} );
			const slotW = rect.width / 12;
			const slotH = rect.height / 5;
			console.assert( Math.abs(slotW - slotH) < .1, `Unexpected slot size ${slotW}x${slotH}` );
			
			const x = rect.left + slotW/2 + column*slotW;
			const y = rect.top + slotH/2 + row*slotH;
			peoroNGU.mouseTo( x, y );
		},
 
		click,
		key,
	};

})();



(()=>{
	function* mergeSeq() {
		while( true ) {
			peoroNGU.focus();
			for( let row = 0; row < 5; ++row ) {
				for( let col = 0; col < 12; ++col ) {
					//console.log( col, row );
					peoroNGU.toInvSlot( col, row );
					peoroNGU.key( 'd' );
					yield;
				}
			}
		}
	}

	const it = mergeSeq();
	function keepMerging() {
		window.mergeHandle = setTimeout( ()=>{
			it.next();
			keepMerging();
		}, 200 );
	}

	peoroNGU.focus();
	keepMerging();
})();


