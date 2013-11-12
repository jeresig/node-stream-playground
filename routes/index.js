var fs = require("fs");
var path = require("path");

process.chdir(path.join(__dirname, '..', 'public'));

var _eval = require("eval");

var blocks = require("../blocks");
var renderCode = require("../public/javascripts/render-code")

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

exports.index = function(req, res){
    res.render('index', {
        blocks: JSON.stringify(buildConf())
    });
};

exports.runCode = function(req, res){
    var curBlocks = JSON.parse(req.body.blocks);
    var blocks = buildConf();

    var _log = [];

    var sandbox = {
        log: function(name, args) {
            return function(data) {
                var file = args.url || args.fileName;

                if (file && file.indexOf(".gz") < 0 || name === "Un-Gzip") {
                    data = data.toString();
                }

                _log.push({
                    name: name,
                    data: data
                });
            };
        },

        done: function(args) {
            return function() {
                var file = args.url || args.fileName;

                if (file && /(output\/[^\/]+)"$/.test(file)) {
                    var fileName = RegExp.$1;

                    fs.readFile(fileName, function(err, data) {
                        sandbox.log("Output: " + file, args)(data);

                        res.send(_log);
                    });
                } else {
                    res.send(_log);
                }
            };
        }
    };

    curBlocks.forEach(function(curBlock) {
        var rootBlock;

        blocks.forEach(function(block) {
            if (block.name === curBlock.name) {
                rootBlock = block;
            }
        });

        // TODO: Verify args
        curBlock.block = rootBlock
    });

    var code = renderCode(curBlocks, true);

    try {
        _eval(code, sandbox, true);
    } catch(e) {
        res.send(500, {error: "Error Evaluating Code: " + e});
    }
};