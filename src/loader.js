
function loadNguJs( nguJsBasePath=(localStorage.getItem('nguJsBasePath')||'https://ngujs.peori.space/') ) {
	// if there's already an ngu.js script element, let's remove it
	{
		const script = document.getElementById('ngu-js-script');
		if( script ) {
			script.remove();
		}
	}

	// adding the ngu.js script element to the DOM
	{
		const script = document.createElement('script');
		script.id = 'ngu-js-script';
		script.onload = ()=>{
			localStorage.setItem( 'nguJsBasePath', nguJsBasePath );
			window.nguJsLib.main();
		};
		script.src = nguJsBasePath+`ngu.js?t=${Date.now()}`;
		document.head.appendChild( script );
	}
}

module.exports = {
	loadNguJs,
};

/*
// the following "oneliner" can be copy-pasted in the browser
(()=>{
	const oldS = document.getElementById('ngu-js-script'); oldS && oldS.remove();
	const s = document.createElement('script');
	s.id = 'ngu-js-script';
	s.src = `https://ngujs.peori.space/ngu.js?t=${Date.now()}`;
	document.head.appendChild( s );
})();
*/

// NOTE: you can use serveo.net to host your own development version:
// ssh -R 80:localhost:8042 serveo.net
