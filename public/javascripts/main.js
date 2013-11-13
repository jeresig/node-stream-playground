var curBlocks = [];

$(function() {
    var blocksTmpl = Handlebars.compile($("#blocks-tmpl").html());
    var argTmpl = Handlebars.compile($("#arg-tmpl").html());
    var colorCount = 0;

    BLOCKS.forEach(function(block) {
        var code = block.data.code.replace(/{{{(\w+)}}}/g, function(all, name) {
            return "__" + name + "__";
        });

        var pretty = prettyCode(code);

        code = pretty.replace(/(require.*?>")([^"]+)/g, function(all, pre, name) {
            if (name !== "fs" && name !== "child_process" && name !== "zlib") {
                return pre + "<a href='http://npmjs.org/package/" + name +
                    "' target=_blank>" + name + "</a>";
            }
            return all;
        });

        block.data.args.forEach(function(arg) {
            code = code.replace("__" + arg.name + "__", argTmpl(arg));
        });

        block.html = code;
    });

    $("#blocks").html(blocksTmpl({blocks: BLOCKS}));

    updateDisplay();
});

var prettyCode = function(code) {
    return Prism.highlight(code, Prism.languages.javascript, "javascript");
};

var updateDisplay = function() {
    $("#output .stream-code").html(prettyCode(renderCode(curBlocks)));

    if (curBlocks.length === 0) {
        $(".block").each(function() {
            $(this).toggleClass("hidden", !$(this).hasClass("input"));
        });

        $("#output, .actions").hide().removeClass("active");

    } else if (curBlocks[curBlocks.length - 1].block.io.output) {
        $(".block").addClass("hidden");
        $("#output").show().addClass("active");

    } else {
        $(".block").each(function() {
            $(this).toggleClass("hidden", !!$(this).hasClass("input"));
        });

        $("#output, .actions").show();
    }
};

var runCode = function(noScroll) {
    $.ajax({
        url: "/",
        type: "POST",
        dataType: "json",
        data: {
            blocks: JSON.stringify(curBlocks.map(function(curBlock) {
                return {
                    name: curBlock.name,
                    args: curBlock.args
                }
            }))
        },
        success: function(log) {
            var logTmpl = Handlebars.compile($("#log-tmpl").html());

            $("#log").html(logTmpl({
                log: log.map(function(item) {
                    item.data = typeof item.data === "object" ?
                        JSON.stringify(item.data) :
                        item.data;

                    if (item.data.indexOf("{") === 0 ||
                            item.data.indexOf("[") === 0) {
                        item.data = prettyCode(item.data);
                    }

                    return item;
                })
            }));

            if (!noScroll) {
                // Scroll to the bottom of the results.
                $("#output").scrollTop($("#output").prop("scrollHeight"));
            }
        },
        error: function() {
            $("#log").html("<pre class='code'>Error.</code>");
        }
    });
};

$(document).on("submit", ".actions form", function() {
    curBlocks.pop();
    
    updateDisplay();

    if (curBlocks.length > 0) {
        runCode(true);
    }

    return false;
});

$(document).on("reset", ".actions form", function() {
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
    runCode();

    return false;
});