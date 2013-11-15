var renderCode = function(curBlocks, log) {
    var requires = {};
    var vars = {};
    var streams = [];
    var indent = "    ";

    curBlocks.forEach(function(curBlock) {
        var data = curBlock.block.data;

        for (var require in data.requires) {
            requires[require] = data.requires[require];
        }

        for (var name in data.vars) {
            vars[name] = Handlebars.compile(data.vars[name])(curBlock.args);
        }

        streams.push({
            name: curBlock.name,
            code: Handlebars.compile(data.stream)(curBlock.args),
            io: curBlock.block.io,
            args: curBlock.args
        });
    });

    var code = [];

    for (var name in requires) {
        code.push("var " + name + " = " + requires[name] + ";");
    }

    code.push("");

    for (var name in vars) {
        code.push("var " + name + " = " + vars[name] + ";");
    }

    code.push("");

    for (var i = 0; i < streams.length; i++) {
        var stream = streams[i];
        var streamCode = stream.code;
        var piped = streamCode;

        if (i > 0) {
            piped = ".pipe(" + streamCode + ")";
            piped = piped.replace(/(^|\n)/g, "$1" + indent);
        }

        code.push((i > 0 ? indent : "") + "// " + stream.name);

        if (i === streams.length - 1 && !log) {
            piped += ";";
        }

        if (log) {
            // We don't actually want to support PUT-ing (for security reasons)
            // so we just hack around it.
            piped = piped.replace(/request\.put.*?output/g,
                "require('fs').createWriteStream(\"output")
        }

        code.push(piped);

        if (log) {
            if (!stream.io.output) {
                code.push(indent + ".pipe(logger._log('" + stream.name + "', " +
                    JSON.stringify(stream.args) + "))");
            }
            if (i === streams.length - 1) {
                code.push(indent + ".on('close', logger._done(" +
                    JSON.stringify(stream.args) + "));");
            }
        }
    }

    return code.join("\n").replace(/^\s+/, "").replace(/\n{3}/g, "\n\n")
        // Fix \t and \n usage
        .replace(/\\\\(\w)/g, "\\$1");
};

var parseCode = function(fn, settings) {
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

        var findArgs = /\s*(\w+)\s*(?:\/\* (.*?) \*\/)?(?:,|$)/g;

        while (findArgs.exec(args)) {
            var name = RegExp.$1;
            var _default = RegExp.$2 || "";

            options.args.push({
                name: name,
                values: _default.split("|").map(function(value) {
                    return value.replace(/:8945/g, ":" + settings.port);
                })
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

var mapping = {
    Readable: {read: true, write: false, input: true},
    Writable: {read: false, write: true, output: true},
    Transform: {read: true, write: true}
};

var buildConf = function(blocks, settings) {
    var results = [];

    for (var style in mapping) {
        var types = blocks[style];
        for (var type in types) {
            results.push({
                name: type,
                style: style,
                io: mapping[style],
                data: parseCode(types[type], settings)
            });
        }
    }

    return results;
};

if (typeof module !== "undefined") {
    var Handlebars = require("handlebars");
    module.exports = {
        renderCode: renderCode,
        buildConf: buildConf
    };
}