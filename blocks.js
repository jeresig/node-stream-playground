module.exports = {
    Readable: {
        "STDIN": function() {
            return process.stdin;
        },

        "Read File": function(fileName /* people.csv */) {
            var fs = require("fs");
            return fs.createReadStream(fileName);
        },

        "HTTP GET Request": function(url /* http://localhost:8945/people.csv */) {
            var request = require("request");
            return request.get(url);
        }
    },

    Writable: {
        "STDOUT": function() {
            return process.stdout;
        },

        "Write File": function(fileName /* output.html */) {
            var fs = require("fs");
            return fs.createWriteStream(fileName);
        },

        "HTTP PUT Request": function(url /* http://localhost:8945/output.html */) {
            var request = require("request");
            return request.put(url);
        }
    },

    Duplex: {
        "Un-Gzip": function() {
            var zlib = require("zlib");
            return zlib.createGunzip();
        },

        "Gzip": function() {
            var zlib = require("zlib");
            return zlib.createGzip();
        },

        "Parse JSON": function(jsonPath /* * */) {
            var JSONStream = require("JSONStream");
            return JSONStream.parse(jsonPath || "*");
        },

        "Turn Into JSON Array String": function() {
            var JSONStream = require("JSONStream");
            return JSONStream.stringify();
        },

        "Change Encoding": function(from, to) {
            var Iconv = require("iconv").Iconv;
            return new Iconv(from, to);
        },

        "Replace": function(from, to) {
            var es = require("event-stream");
            return es.replace(from, to);
        },

        "Split Strings": function(separator) {
            var es = require("event-stream");
            return es.split(separator);
        },

        "Join Strings": function(separator) {
            var es = require("event-stream");
            return es.join(separator);
        },

        "Concat Strings": function() {
            var es = require("event-stream");
            return es.wait();
        },

        "Wrap Strings": function(start, end) {
            var es = require("event-stream");
            return es.mapSync(function(data) {
                return start + data + end;
            });
        },

        "Parse CSV as Object": function() {
            var csv = require("csv-stream");
            return csv.createStream({escapeChar: '"', enclosedChar: '"'});
        },

        "Parse CSV as Array": function() {
            // TODO: Switch to different module?
            var csv = require("csv-stream");
            return csv.createStream();
        },

        "Convert Object w/ Handlebars": function(source) {
            var Handlebars = require("handlebars");
            var tmpl = Handlebars.compile(source);
            var es = require("event-stream");
            return es.mapSync(tmpl);
        },

        "Sprintf Array": function(format) {
            var util = require("util");
            var es = require("event-stream");
            return es.mapSync(function(data) {
                return util.format.apply(util, [format].concat(data));
            });
        },

        "Read HTML": function(selector) {
            var trumpet = require("trumpet");
            var tr = trumpet();
            return tr.selectAll(selector).createReadStream();
        },

        "Insert HTML": function(selector) {
            var trumpet = require("trumpet");
            var tr = trumpet();
            return tr.selectAll(selector).createWriteStream();
        },

        "Grep": function() {
            var cp = require("child_process");
            var es = require("event-stream");
            var grep = cp.exec("grep Stream");
            return es.duplex(grep.stdin, grep.stdout);
        }
    },

    "End": {
        "Open File": function(fileName) {
            var open = require("open");
            var path = require("path");
            open(path.join(__dirname, fileName));
        },

        "Open URL": function(url) {
            var open = require("open");
            open(url);
        }
    }
};