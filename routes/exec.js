module.exports = function(moduleMap) {
    var domain = require("domain");

    var Logger = require("./logger");

    var modules = {};

    for (var module in moduleMap) {
        modules[module] = require(moduleMap[module]);
    }

    var moduleLoader = function(name) {
        for (var module in moduleMap) {
            if (moduleMap[module] === name) {
                return modules[module];
            }
        }
    };

    return function(code, callback) {
        var logger = new Logger(callback);

        var evalDomain = domain.create();

        evalDomain.on("error", function(err) {
            logger.error(err);
        });

        evalDomain.run(function() {
            // Run everything in nextTick so that the error doesn't bubble up
            process.nextTick(function() {
                (new Function("logger", "require", code))(logger, moduleLoader);
            });
        });
    };
};