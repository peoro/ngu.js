
# NGU.js
> A bot and bot framework for [NGU IDLE](https://www.kongregate.com/games/somethingggg/ngu-idle)

This is a bot for [NGU IDLE](https://www.kongregate.com/games/somethingggg/ngu-idle). It's cross platform and it's meant to run directly on the browser.

It's already functional, but lacking many features and development is proceeding veeery slowly.

Any help is welcome. If you wish to contribute, check the [development](#development) section.

## How to use

To run this bot:

1. Open your browser's JavaScript console in the game page:
	- In Chromium press  `ctrl+shift+J`.
	- In Firefox press `ctrl+shift+K`.
2. Select NGU's iframe:
	- In Chromium: select `gameiframe` in the dropdown menu of the JavaScript console (by default it's in the `top` frame).
	- In Firefox: click the *frame button* (the first icon on the top right of the developer toolbar), then select the second frame.
3. Paste the following code in the console:
	```javascript
	(()=>{
		const oldS = document.getElementById('ngu-js-script'); oldS && oldS.remove();
		const s = document.createElement('script');
		s.id = 'ngu-js-script';
		s.src = `https://ngujs.peori.space/ngu.js?t=${Date.now()}`;
		document.head.appendChild( s );
	})();
	```

This should create a new button reading `.js` in the bottom left of the screen: hover it to control the bot.

## Development

I started working on this project because no cross-platform bot or script was available for NGU and, most importantly, because I find scripting a game more interesting than playing it.

What makes this bot cross-platform is that it runs within the browser and uses the browser's API to interface with the game.  
NGU in fact offers no API: bots need to emulate input events to perform actions, and to parse the pixels of the game window to gather information. NGU.js reads pixels from the game Canvas and triggers DOM Events to talk with the game.  
Having to use such a low level interface makes the development of a bot very interesting and challenging. It also makes it necessary to deal with some tedious details, which is what periodically bores me away.

### Running your own NGU.js

Once you change something in NGU.js you will want to run your modified version. That's never been easier.

The following command will automatically rebuilt any changes on the fly, and start a development server (on port 8042 by default):
```bash
npm run start:dev
```

You will need to expose your NGU.js through HTTPS with a valid certificate, or the browser will refuse to load it, due to security policies.  
The simplest way to achieve that is to put your NGU.js development server behind a HTTPS tunnel. You can use serveo.net, just by running:

```bash
npm run serveo
```

Then you'll find your NGU.js at `https://${USER}-ngujs.serveo.net/`.  
Serveo is often down though. If you wish a more stable HTTPS tunnel contact me, and I'll be able to set one up at `https://ngujs.peori.space/${USER}`.  
Test whether your development version is working by loading `${YOUR_HTTPS_NGUJS_URL}/ngu.js`.

Once your development version is up, you can load it into the browser by inputting its URL at the bottom of the NGU.js popup.

If you wish to build NGU.js without starting a development server, run:

```bash
npm run build # `npm run build:dev` for the development version
```

You'll find the built version in the `dist/` directory. You can offer that through HTTPS, or copy its content directly into your browser's console.

If you develop something useful, don't forget to send a Pull Request!

### Architecture

The plan is to split up NGU.js into three logically separated modules:

- [NGU.assets](https://github.com/peoro/ngu.assets), which describes the assets on the game in an agnostic way. It should describe where the widgets of the game are, include the images used by the game etc. This module could be shared with other bots, even ones written in different programming languages.
- A bot framework, which offers a high level interface to control the game with ease.
	- It should expose low-level functions like "read pixel x,y", "move mouse to x,y", "press key `K`".
	- And mid-level functions like "go to time machine", "query inventory slots", "input 1e12 energy", "query enemy HP".
- High level logic, that implements complex functionalities. Like fighting enemies in ITOPOD as fast as possible while keeping the inventory tidy; doing three minute rebirths one after another; or even playing the entire game automatically from the very beginning to the end.

Currently though...

- [NGU.assets](https://github.com/peoro/ngu.assets) hasn't received its first commit yet. All the asset information is scattered all over [`src/ngu.js`](https://github.com/peoro/ngu.js/blob/master/src/ngu.js).
- The bot framework is the vast majority of the code in this repository. Most of it is in a decent enough state.
- The high level logic is horribly hacked together in [`src/loops.js`](https://github.com/peoro/ngu.js/blob/master/src/loops.js) and [`src/logic.js`](https://github.com/peoro/ngu.js/blob/master/src/logic.js). Probably you should touch these files if you want to add a feature to aid yourself in the game. In case you really want to try, I wish you good luck and offer my most sincere apologies. Yuck!

#### Bot framework

The Bot framework currently looks like this...

- [`src/index.js`](https://github.com/peoro/ngu.js/blob/master/src/index.js) is the bot entry point. It uninstall any existing version of NGU.js that might already be running, then it instantiates and *run* a new `NguJs` object.
- [`src/ngujs.js`](https://github.com/peoro/ngu.js/blob/master/src/ngujs.js) defines `NguJs`: the singleton bot instance. Upon creation it instantiates the UI, IO, Logic, LoopRunner and GUI modules. It also offers a function to uninstall itself.
- [`src/ui.js`](https://github.com/peoro/ngu.js/blob/master/src/ui.js) defines the UI: an abstraction to draw points, rects etc on the canvas, useful to see what action the bot is performing. It also creates the DOM Element that will host any Element NGU.js might need to create.
- [`src/io.js`](https://github.com/peoro/ngu.js/blob/master/src/io.js) defines the IO: a `Mouse`, `Keyboard` and `Framebuffer` classes useful to trigger input events and to read pixels from the canvas. IO transparently schedules input events so that the game can receive them all in the correct order. Promises (and thus `async`/`await`) can be used to synchronize with the scheduled events.
- [`src/logic.js`](https://github.com/peoro/ngu.js/blob/master/src/logic.js) defines the Logic: an abstraction to some mid-level functionalities like `isEnemyAlive()` or `getMovesInfo()`.
- [`src/ngu_widgets.js`](https://github.com/peoro/ngu.js/blob/master/src/ngu_widgets.js) describes the widgets used by NGU: `Bar`, `InventorySlot`, `RegularButton` etc. A useful abstraction to interact with these components.
- [`src/loops.js`](https://github.com/peoro/ngu.js/blob/master/src/loops.js) defines `LoopRunner` and implement a few *loops*: complex pieces of logic handling the game over extended periods of time. Be careful: everything about this is ugly and should be rewritten.
- [`src/gui.js`](https://github.com/peoro/ngu.js/blob/master/src/gui.js) handles NGU.js' GUI: the `.js` button in the bottem left and the pop-up it opens.

### TODO

My next priority is implementing image recognition. I'd love to be able to recognize which items are in the inventory. With that capability it could be a lot easier to implement efficient *loops* and very interesting features, like embedding the [gear optimizer](https://gmiclotte.github.io/gear-optimizer/) directly into the game.  
Image recognition is not easy. Something that complicates it a lot, is that the same image looks slightly different in different places (e.g. items in the item list are barely brighter than those in the inventory). I designed a noise-tolerant and lightweight hashing function (see [`src/imageid.js`](https://github.com/peoro/ngu.js/blob/master/src/imageid.js)), and would like to use it to statically pre-computed a hash for every image. This would make image support very lightweight (no need to embed image files within NGU.js) and efficient.  
However, before continuing down this path, I'd like to have all the item images (and as much other data as possible) committed into [NGU.assets](https://github.com/peoro/ngu.assets).

Another useful task would be to completely rewrite the whole high-level logic abstraction (currently called "loop").

The GUI could also receive tons of tweaks. I'm dreaming about being able to control several kind of functionalities (high-level functions, mid-level functions, tweaking game preferences, NGU.js settings, debugging functions, unit tests etc), and having a nice GUI grouping everything in different tabs.

### Help Wanted

Any help is welcome. If you wish to participate, drop a message on discord (to `peoro` or in the `scripting` chat), or open an issue on [peoro/ngu.js](https://github.com/peoro/ngu.js).
