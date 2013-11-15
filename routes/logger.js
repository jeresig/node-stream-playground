var fs = require("fs");
var through = require("through");

var Logger = function(callback) {
    this._logs = [];
    this._callback = callback;
}

Logger.prototype = {
    _queueLog: function(name, args, data) {
        var file = args.url || args.fileName;

        if (file && file.indexOf(".gz") < 0 || name === "Un-Gzip") {
            data = data.toString();
        }

        this._logs.push({
            name: name,
            data: data
        });
    },

    _log: function(name, args) {
        var self = this;

        return through(function(data) {
            self._queueLog(name, args, data);

            this.queue(data);
        });
    },

    _error: function(err) {
        this._queueLog("Error", {}, err.toString());
        this._callback(this._logs);
    },

    _done: function(args) {
        var self = this;

        return function() {
            var file = args.url || args.fileName;

            if (file && /(output\/[^"]+)"$/.test(file)) {
                var fileName = RegExp.$1;

                // Ugh. A silly hack to wory around inserting HTML with
                // trumpet.
                setTimeout(function() {
                    fs.readFile(fileName, function(err, data) {
                        // Remove the session ID
                        file = file.replace(/output\/\w+/, "output");
                        self._queueLog("Output: " + file, args, data);
                        self._callback(self._logs);
                    });
                }, 100);
            } else {
                self._callback(self._logs);
            }
        };
    }
};

module.exports = Logger;