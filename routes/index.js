module.exports = function(settings) {

var fs = require("fs");
var path = require("path");
var domain = require("domain");

var through = require("through");
var _eval = require("eval");

var blocks = require("../blocks");
var renderCode = require("../public/javascripts/render-code")

process.chdir(path.join(__dirname, '..', 'public'));

var mapping = {
    Readable: {read: true, write: false, input: true},
    Writable: {read: false, write: true, output: true},
    Transform: {read: true, write: true}
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

return {
    index: function(req, res){
        res.render('index', {
            blocks: JSON.stringify(buildConf())
        });
    },

    runCode: function(req, res){
        var _log = [];

        var _queueLog = function(name, args, data) {
            var file = args.url || args.fileName;

            if (file && file.indexOf(".gz") < 0 || name === "Un-Gzip") {
                data = data.toString();
            }

            _log.push({
                name: name,
                data: data
            });
        };

        var sandbox = {
            _log: function(name, args) {
                return through(function(data) {
                    _queueLog(name, args, data);

                    this.queue(data);
                });
            },

            _done: function(args) {
                return function() {
                    var file = args.url || args.fileName;

                    if (file && /(output\/[^\/]+)"$/.test(file)) {
                        var fileName = RegExp.$1;

                        // Ugh. A silly hack to wory around inserting HTML with
                        // trumpet.
                        setTimeout(function() {
                            fs.readFile(fileName, function(err, data) {
                                _queueLog("Output: " + file, args, data);

                                res.send(_log);
                            });
                        }, 100);
                    } else {
                        res.send(_log);
                    }
                };
            }
        };

        var evalDomain = domain.create();

        evalDomain.on("error", function(err) {
            console.log("ERROR HANDLED")
            _queueLog("Error", {}, err.toString());
            res.send(200, _log);
        });

        evalDomain.run(function() {
            // Run everything in nextTick so that the error doesn't bubble up
            process.nextTick(function() {
                var curBlocks = JSON.parse(req.body.blocks);
                var blocks = buildConf();
                var error;

                curBlocks.forEach(function(curBlock) {
                    if (error) {
                        return;
                    }

                    var rootBlock;

                    blocks.forEach(function(block) {
                        if (block.name === curBlock.name) {
                            rootBlock = block;
                        }
                    });

                    curBlock.block = rootBlock;

                    if (!rootBlock) {
                        error = "Invalid stream name: " + curBlock.name;
                        return;
                    }

                    var rootArgs = rootBlock.data.args;

                    for (var arg in curBlock.args) {
                        var value = JSON.parse(curBlock.args[arg]);
                        rootArgs.forEach(function(rootArg) {
                            if (rootArg.name === arg &&
                                    rootArg.values.indexOf(value) < 0) {
                                error = "Invalid argument value: " + value;
                            }
                        });
                    }
                });

                if (error) {
                    throw new Error(error);
                    return;
                }

                var code = renderCode(curBlocks, true);

                _eval(code, sandbox, true);
            });
        });
    }
};

};
