var blocks = require("../blocks");

var mapping = {
    Readable: {read: true, write: false, input: true},
    Writable: {read: false, write: true, output: true},
    Duplex: {read: true, write: true},
    End: {read: false, write: false}
};

var parseCode = function(fn) {
    var options = {
        args: [],
        requires: {},
        vars: {},
        stream: ""
    };

    var match = /^function\s*\((.*?)\)\s*{\n([\s\S]*)}$/.exec(fn);

    if (match) {
        var args = match[1];
        var code = match[2];

        var leadingSpaces = /^\s*/.exec(code);
        var stripLeadingSpaces = new RegExp("\n" + leadingSpaces[0], "g");

        code = code.replace(stripLeadingSpaces, "\n").trim();

        var findArgs = /\s*(\w+)\s*(?:\/\*\s*(.*?)\s*\*\/)?(?:,|$)/g;

        while (findArgs.exec(args)) {
            var name = RegExp.$1;
            var _default = RegExp.$2 || "";

            options.args.push({
                name: name,
                values: _default.split("|")
            });

            // Replace variables with handlebars templates
            code = code.replace(new RegExp(name, "g"), "{{{" + name + "}}}");
        }

        if (/\breturn ([\s\S]+);$/.test(code)) {
            options.stream = RegExp.$1;
        }

        options.code = code.replace(/(?:^|\n)return /g, "\nvar stream = ");

        var findVar = /\bvar (\w+) = ([^;]+);/g;

        while (findVar.exec(code)) {
            var name = RegExp.$1;
            var value = RegExp.$2;

            if (/^require/.test(value)) {
                options.requires[name] = value;
            } else {
                options.vars[name] = value;
            }
        }
    }

    return options;
};

var buildConf = function() {
    var results = [];

    for (var style in blocks) {
        var types = blocks[style];
        for (var type in types) {
            results.push({
                name: type,
                style: style,
                io: mapping[style],
                data: parseCode(types[type])
            });
        }
    }

    return results;
};

// Demos:

/*
streams.Readable["Read File"]("input/people.csv")
    .pipe(streams.Duplex["Parse CSV as Object"]())
    .pipe(streams.Duplex["Turn Into JSON Array String"]())
    .pipe(streams.Writable["STDOUT"]())

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

exports.index = function(req, res){
    res.render('index', {
        blocks: JSON.stringify(buildConf())
    });
};