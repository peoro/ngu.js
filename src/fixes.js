
// a bunch of fixes necessary to work in the same window with NGU, without breaking the game

// implementing our own typing function in the keydown handler
// unfortunately NGU calls `window.addEventListener('keypress', f, {capture:true, passive:true});`
// and within such handler it stops the event propagation: the input fields won't ever receive keypress events, which are the ones used to implement typing.
function implementTyping( input ) {
	input.addEventListener( `keydown`, (e)=>{
		// TODO(peoro): why this is not working? O,o MDN describes it...
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

Object.assign( module.exports, {implementTyping} );
