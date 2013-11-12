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

var updateDisplay = function() {
    $("#output .code").text(renderCode(curBlocks));

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

var runCode = function() {
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
                    return item;
                })
            }));

            // Scroll to the bottom of the results.
            $("#output").scrollTop($("#output").prop("scrollHeight"));
        },
        error: function() {
            $("#log").html("Error.");
        }
    });
};

$(document).on("submit", ".actions form", function() {
    runCode();

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