module.exports = function(settings) {

var fs = require("fs");
var path = require("path");

var allBlocks = require("../blocks");
var code = require("../public/javascripts/code");

var exec = require("./exec")(allBlocks.modules);
var blockConf = code.buildConf(allBlocks, settings);

process.chdir(path.join(__dirname, "..", "public"));

return {
    index: function(req, res) {
        res.render("index", {
            blocks: JSON.stringify(blockConf)
        });
    },

    runCode: function(req, res) {
        var error;
        var outputBlock;

        try {
            var curBlocks = JSON.parse(req.body.blocks);
        } catch(e) {
            error = "Error parsing JSON.";
        }

        if (curBlocks.length === 0) {
            error = "No streams specified.";
        } else if (curBlocks.length > 30) {
            error = "Too many streams specified.";
        }

        curBlocks.forEach(function(curBlock) {
            if (error) {
                return;
            }

            var rootBlock;

            blockConf.forEach(function(block) {
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

            if (rootBlock.io.output) {
                outputBlock = curBlock;
            }
        });

        if (!error) {
            if (outputBlock) {
                if (/^[a-z0-9]+$/i.test(outputBlock.session)) {
                    // Make the tmp session directory exists
                    fs.mkdir("output/" + outputBlock.session, function() {
                        var args = outputBlock.args;
                        for (var arg in args) {
                            if (arg === "url" || arg === "fileName") {
                                args[arg] = args[arg].replace(/output\//g,
                                    "output/" + outputBlock.session + "/");
                            }
                        }
                        exec(code.renderCode(curBlocks, true), function(logs) {
                            res.send(200, logs);
                        });
                    });

                } else {
                    error = "Invalid session ID.";
                }

            } else {
                exec(code.renderCode(curBlocks, true), function(logs) {
                    res.send(200, logs);
                });
            }
        }

        if (error) {
            res.send(200, [{
                name: "Error",
                data: error
            }]);
        }
    }
};

};
