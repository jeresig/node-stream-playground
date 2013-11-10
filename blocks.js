module.exports = {
    Readable: {
        "STDIN": function() {
            return process.stdin;
        },

        "Read File": function(fileName /* input/people.csv|input/people.csv.gz|input/people.json|input/people.json.gz|input/people.tsv|input/people.tsv.gz */) {
            var fs = require("fs");
            return fs.createReadStream(fileName);
        },

        "HTTP GET Request": function(url /* http://localhost:8945/input/people.csv|http://localhost:8945/input/people.csv.gz|http://localhost:8945/input/people.json|http://localhost:8945/input/people.json.gz|http://localhost:8945/input/people.tsv|http://localhost:8945/input/people.tsv.gz */) {
            var request = require("request");
            return request.get(url);
        }
    },

    Writable: {
        "STDOUT": function() {
            return process.stdout;
        },

        "Write File": function(fileName /* output/people.html|output/people.json|output/people.json.gz|output/people.csv|output/people.csv.gz|output/people.tsv|output/people.tsv.gz */) {
            var fs = require("fs");
            return fs.createWriteStream(fileName);
        },

        "HTTP PUT Request": function(url /* http://localhost:8945/output/people.html|http://localhost:8945/output/people.json|http://localhost:8945/output/people.json.gz|http://localhost:8945/output/people.csv|http://localhost:8945/output/people.csv.gz|http://localhost:8945/output/people.tsv|http://localhost:8945/output/people.tsv.gz */) {
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

        "Change Encoding": function(from /* EUC-JP */, to /* UTF-8 */) {
            var Iconv = require("iconv").Iconv;
            return new Iconv(from, to);
        },

        "Replace": function(from /* John */, to /* Bob */) {
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

        "Wrap Strings": function(start /* <table>|<table><tr><th>Name</th><th>City</th></tr> */, end /* </table> */) {
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

        "Convert Object w/ Handlebars": function(source /* <tr><td><a href='{{URL}}'>{{Name}}</a></td><td>{{City}}</td></tr> */) {
            var Handlebars = require("handlebars");
            var tmpl = Handlebars.compile(source);
            var es = require("event-stream");
            return es.mapSync(tmpl);
        },

        "Read HTML": function(selector /* */) {
            var trumpet = require("trumpet");
            var tr = trumpet();
            return tr.selectAll(selector).createReadStream();
        },

        "Insert HTML": function(selector /* */) {
            var trumpet = require("trumpet");
            var tr = trumpet();
            return tr.selectAll(selector).createWriteStream();
        },

        // Remove?
        "Grep": function() {
            var cp = require("child_process");
            var es = require("event-stream");
            var grep = cp.exec("grep Stream");
            return es.duplex(grep.stdin, grep.stdout);
        },

        "Sprintf": function(format /* <tr><td><a href='%(URL)s'>%(Name)s</a></td><td>%(City)s</td></tr>|<tr><td><a href='%2$s'>%1$s</a></td><td>%3$s</td></tr> */) {
            var vsprintf = require("sprintf").vsprintf;
            var es = require("event-stream");
            return es.mapSync(function(data) {
                return vsprintf(format, data);
            });
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