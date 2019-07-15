
const assert = require('assert');
const {px} = require('../src/util.js');
const {IO, Keyboard} = require('../src/io.js');
const {leftArrow, rightArrow} = Keyboard.keys;

describe( `io`, function(){
	describe(`Input event requests wait for their turn to act`, function(){

		let input; // `: [[event]]`: a new array `[event]` every time we wait for the next frame
		let io;

		beforeEach( function(){
			input = [];
			io = new IO( document.getElementById('#canvas'), null, {headless:true} );
			io.eachFrame( ()=>{ input.push([]); });
		});
		afterEach( function(){
			io.destroy();
		});

		const inputLogger = (data)=>{
			return ()=>{ input[input.length-1].push(data); };
		};

		const move = (p)=>{ io.mouse.move(p).then( inputLogger({ev:`move`, p}) ); };
		const click = (button)=>{ io.mouse.click(button).then( inputLogger({ev:`click`, button}) ); };
		const press = (key)=>{ io.keyboard.press(key).then( inputLogger({ev:`press`, key}) ); };

		it( `empty next frames`, async function(){
			assert.deepEqual(input, [
				[]
			]);
			await io.nextFrame;

			assert.deepEqual(input, [
				[], [],
			]);
			await io.nextFrame;

			assert.deepEqual(input, [
				[], [], [],
			]);
		});

		it( `mouse move`, async function(){
			move( px(0,0) );
			await io.sync();

			assert.deepEqual(input, [
				[ {ev:`move`, p:px(0,0)}, ],
				[],
			]);
		});

		it( `multiple mouse moves`, async function(){
			move( px(0,0) );
			move( px(1,1) );
			move( px(2,2) );
			move( px(3,3) );
			await io.sync();

			assert.deepEqual(input, [
				[ {ev:`move`, p:px(0,0)}, ],
				[ {ev:`move`, p:px(1,1)}, ],
				[ {ev:`move`, p:px(2,2)}, ],
				[ {ev:`move`, p:px(3,3)}, ],
				[],
			]);
		});

		it( `click`, async function(){
			click( 0 );
			await io.sync();

			assert.deepEqual(input, [
				[ {ev:`click`, button:0}, ],
				[],
			]);
		});

		it( `clicks`, async function(){
			click( 0 );
			click( 0 );
			click( 1 );
			click( 0 );
			await io.sync();

			assert.deepEqual(input, [
				[ {ev:`click`, button:0}, ],
				[ {ev:`click`, button:0}, ],
				[ {ev:`click`, button:1}, ],
				[ {ev:`click`, button:0}, ],
				[],
			]);
		});

		it( `key presses`, async function(){
			press( leftArrow );
			press( leftArrow );
			press( rightArrow );
			press( leftArrow );
			await io.sync();

			assert.deepEqual(input, [
				[ {ev:`press`, key:leftArrow}, ],
				[ {ev:`press`, key:leftArrow}, ],
				[ {ev:`press`, key:rightArrow}, ],
				[ {ev:`press`, key:leftArrow}, ],
				[],
			]);
		});

		it( `all together`, async function(){
			move( px(0,0) );
			click( 0 );
			press( leftArrow );

			press( rightArrow );

			click( 1 );

			move( px(1,1) );

			await io.sync();

			assert.deepEqual(input, [
				[ {ev:`move`, p:px(0,0)}, {ev:`click`, button:0}, {ev:`press`, key:leftArrow}, ],
				[ {ev:`press`, key:rightArrow}, ],
				[ {ev:`click`, button:1}, ],
				[ {ev:`move`, p:px(1,1)}, ],
				[],
			]);
		});

		it( `all together 2`, async function(){
			move( px(0,0) );
			click( 0 );

			move( px(1,1) );
			click( 0 );

			await io.sync();

			assert.deepEqual(input, [
				[ {ev:`move`, p:px(0,0)}, {ev:`click`, button:0}, ],
				[ {ev:`move`, p:px(1,1)}, {ev:`click`, button:0}, ],
				[],
			]);

		});
	});
});
