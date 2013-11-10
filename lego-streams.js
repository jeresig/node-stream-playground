var mapping = {
    Readable: {read: true, write: false, start: true},
    Writable: {read: false, write: true},
    Duplex: {read: true, write: true},
    Through: {read: true, write: true},
    End: {read: false, write: false, end: true}
};

var streams = require("./blocks");

var parseArgs = function(fn) {
    var options = [];

    var match = /^function\s*\((.*?)\)\s*{/.exec(fn);

    if (match) {
        var args = match[1];
        var findArgs = /\s*(\w+)\s*(?:\/\*\s*(.*?)\s*\*\/)?(?:,|$)/g;
        while (findArgs.exec(args)) {
            options.push({name: RegExp.$1, _default: RegExp.$2 || ""});
        }
    }

    return options;
};

// TODO: Fire up HTTP server
// Handle file gets
// Handle PUT for files
// Perhaps return URL for file after PUT?
// TODO: Build JSON and pass to client
// Allow client to snap together blocks
// Send commands to the server and watch output
// Log output at each step and send to client

/*
for (var type in streams.Readable) {
    console.log(type, parseArgs(streams.Readable[type]));
}
*/

// Demos:

streams.Readable["Read File"]("input/people.csv")
    .pipe(streams.Duplex["Parse CSV as Object"]())
    .pipe(streams.Duplex["Turn Into JSON Array String"]())
    .pipe(streams.Writable["STDOUT"]())

/*
streams.Readable["Read File"]("people.json")
    .pipe(streams.Duplex["Parse JSON"]("*"))
    .pipe(streams.Duplex["Convert Object w/ Handlebars"]("<tr><td><a href='{{URL}}'>{{Name}}</a></td><td>{{City}}</td></tr>"))
    .pipe(streams.Duplex["Concat Strings"]())
    .pipe(streams.Duplex["Wrap Strings"]("<table><tr><th>Name</th><th>City</th></tr>", "</table>"))
    .pipe(streams.Writable["Write File"]("test.html"))
    .on("close", function() {
        streams.End["Open File"]("test.html");
    });
*/

/*
streams.Readable["Read File"]("people.csv")
    .pipe(streams.Duplex["Parse CSV as Object"]())
    .pipe(streams.Duplex["Convert Object w/ Handlebars"]("<tr><td><a href='{{URL}}'>{{Name}}</a></td><td>{{City}}</td></tr>"))
    .pipe(streams.Duplex["Concat Strings"]())
    .pipe(streams.Duplex["Wrap Strings"]("<table><tr><th>Name</th><th>City</th></tr>", "</table>"))
    .pipe(streams.Writable["Write File"]("test.html"))
    .on("close", function() {
        streams.End["Open File"]("test.html");
    });
*/