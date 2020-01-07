Node.js Stream Playground
============

Explore Node.js streams with an interactive playground.

![node-stream-playground](http://ejohn.org/files/node-stream-playground.500.jpg)

The Node.js Stream Playground was created to help Node.js developers better understand how [streams](http://nodejs.org/api/stream.html) work by showing a number of use cases that are easily plug-and-play-able. Additionally detailed logging is provided at every step to help users better understand what events the streams are emitting and exactly what their contents are.

Adding in New Streams
---------------------

If you're interested in extending the playground and adding in new pluggable "blocks" you can simply edit `blocks.js` and add in the stream functions. A common stream block would look something like this:

	"Change Encoding": function(from /* EUC-JP */, to /* UTF-8 */) {
	    var Iconv = require("iconv").Iconv;
	    return new Iconv(from, to);
	},

The property name is the full title/description of the stream. The arguments to the function are variables that you wish the user to populate. The comments immediately following the argument names are the default values (you can provide multiple values by separating them with a `|`).

The streams are split into 3 types: "Readable", "Writable", "Transform" (in that they read content, modify it, and pass it through). Typically it is assumed that "Readable" streams will be the first ones that you can choose in the playground, "Writeable" streams will end the playground, and everything else is just ".pipe()able".

If you've added a new stream please send a pull request and I'll be happy to add it!

Running Your Own Server
-----------------------

Be sure to run `npm install` to install all the dependencies. You can then use just `node app.js` to run a server - or if you wish to run something more robust you can install `naught` and run `npm start`.

**WARNING** I have no idea how robust the application's security is. This application is generating and executing code on the user's behalf (although it is not allowing arbitrary code to be executed). Feel free to run it on a local server or, if you feel confident in the code, run it on your own server. At the moment I'm running it on a standalone server with nothing else on it, just in case.

Inspiration and Credits
-----------------------

This project was created by [John Resig](http://ejohn.org/). The code is released under an MIT license.

The project was originally created for, and demoed at, the [inaugural Brooklyn.js meetup](http://brooklynjs.com/).

This project was heavily inspired by the amazing [stream-adventure](https://github.com/substack/stream-adventure) project and the [stream-handbook](https://github.com/substack/stream-handbook). You should explore both of those resources if you wish to learn more about Node streams.
