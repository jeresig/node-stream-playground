var curBlocks = [];

$(function() {
    var blocksTmpl = Handlebars.compile($("#blocks-tmpl").html());
    var argTmpl = Handlebars.compile($("#arg-tmpl").html());

    BLOCKS.forEach(function(block) {
        var args = {};

        block.data.args.forEach(function(arg) {
            args[arg.name] = argTmpl(arg);
        });

        block.html = Handlebars.compile(block.data.code)(args);
    });

    $("#blocks").html(blocksTmpl({blocks: BLOCKS}));

    updateDisplay();
});

var renderCode = function() {
    var requires = {};
    var vars = {};
    var streams = [];

    curBlocks.forEach(function(curBlock) {
        var data = curBlock.block.data;

        $.extend(requires, data.requires);

        for (var name in data.vars) {
            vars[name] = Handlebars.compile(data.vars[name])(curBlock.args);
        }

        streams.push({
            name: curBlock.name,
            code: Handlebars.compile(data.stream)(curBlock.args)
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
            piped = piped.replace(/(^|\n)/g, "$1    ");
        }

        code.push((i > 0 ? "    " : "") + "// " + stream.name);

        if (i === streams.length - 1) {
            piped += ";";
        }

        code.push(piped);
    }

    return code.join("\n");
};

var updateDisplay = function() {
    $("#output .code").text(renderCode());

    if (curBlocks.length === 0) {
        $(".block").each(function() {
            $(this).toggleClass("hidden", !$(this).hasClass("input"));
        });

        $("#output").hide().removeClass("active");

    } else if (curBlocks[curBlocks.length - 1].block.io.output) {
        $(".block").addClass("hidden");
        $("#output").show().addClass("active");

    } else {
        $(".block").each(function() {
            $(this).toggleClass("hidden", !!$(this).hasClass("input"));
        });

        $("#output").show();
    }
};

$(document).on("submit", "#output form", function() {
    return false;
});

$(document).on("reset", "#output form", function() {
    curBlocks = [];
    updateDisplay();
    return false;
});

$(document).on("submit", "#blocks form", function() {
    var curBlock = {
        name: $(this).find("[name=name]").val(),
        args: {}
    };

    $(this).find(".arg").serializeArray().forEach(function(arg) {
        curBlock.args[arg.name] = JSON.stringify(arg.value);
    });

    BLOCKS.forEach(function(block) {
        if (curBlock.name === block.name) {
            curBlock.block = block
        }
    });

    curBlocks.push(curBlock);

    updateDisplay();

    return false;
});