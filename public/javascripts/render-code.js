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
                code.push(indent + ".pipe(_log('" + stream.name + "', " +
                    JSON.stringify(stream.args) + "))");
            }
            if (i === streams.length - 1) {
                code.push(indent + ".on('close', _done(" +
                    JSON.stringify(stream.args) + "));");
            }
        }
    }

    return code.join("\n").replace(/^\s+/, "").replace(/\n{3}/g, "\n\n")
        // Fix \t and \n usage
        .replace(/\\\\(\w)/g, "\\$1");
};

if (typeof module !== "undefined") {
    var Handlebars = require("handlebars");
    module.exports = renderCode;
}