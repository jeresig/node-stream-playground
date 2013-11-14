module.exports = {
    Readable: {
        "Read File": function(fileName /* input/people.csv|input/people.csv.gz|input/people_utf8.csv|input/people_euc-jp.csv|input/people_euc-jp.csv.gz|input/people.json|input/people.json.gz|input/people.tsv|input/people.tsv.gz */) {
            var fs = require("fs");
            return fs.createReadStream(fileName);
        },

        "HTTP GET Request": function(url /* http://localhost:8945/input/people.csv|http://localhost:8945/input/people.csv.gz|http://localhost:8945/input/people_utf8.csv|http://localhost:8945/input/people_euc-jp.csv|http://localhost:8945/input/people_euc-jp.csv.gz|http://localhost:8945/input/people.json|http://localhost:8945/input/people.json.gz|http://localhost:8945/input/people.tsv|http://localhost:8945/input/people.tsv.gz */) {
            var request = require("request");
            return request(url);
        }
    },

    Writable: {
        "Write File": function(fileName /* output/people.html|output/people.json|output/people.json.gz|output/people.csv|output/people.csv.gz|output/people.tsv|output/people.tsv.gz */) {
            var fs = require("fs");
            return fs.createWriteStream(fileName);
        },

        "HTTP PUT Request": function(url /* http://localhost:8945/output/people.html|http://localhost:8945/output/people.json|http://localhost:8945/output/people.json.gz|http://localhost:8945/output/people.csv|http://localhost:8945/output/people.csv.gz|http://localhost:8945/output/people.tsv|http://localhost:8945/output/people.tsv.gz */) {
            var request = require("request");
            return request.put(url);
        },

        "Insert HTML": function(inFile /* input/people_table_tmpl.html|input/people_ul_tmpl.html */, fileName /* output/people.html */, selector /* tbody|ul */) {
            var fs = require("fs");
            var trumpet = require("trumpet");
            var tr = trumpet();
            var trOut = fs.createReadStream(inFile)
                .pipe(tr)
                .pipe(fs.createWriteStream(fileName));
            return tr.select(selector).createWriteStream();
        }
    },

    Transform: {
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
            return JSONStream.parse(jsonPath);
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

        "Split Strings": function(separator /* \n|\t|, */) {
            var es = require("event-stream");
            return es.split(separator);
        },

        "Split Strings into Array": function(separator /* \t|,|\n */) {
            var es = require("event-stream");
            return es.mapSync(function(data) {
                return data.split(separator);
            });
        },

        "Join Strings": function(separator /* \n|\t|, */) {
            var es = require("event-stream");
            return es.join(separator);
        },

        "Concat Strings": function() {
            var es = require("event-stream");
            return es.wait();
        },

        "Wrap Strings": function(start /* <table><tr><th>Name</th><th>City</th></tr>\n|<table>\n|<ul>|Name,URL,City\n|Name\tURL\tCity\n */, end /* \n</table>|\n</ul>| */) {
            var es = require("event-stream");
            return es.mapSync(function(data) {
                return start + data + end;
            });
        },

        "Parse CSV as Object": function() {
            var csv = require("csv-streamify");
            return csv({objectMode: true, columns: true});
        },

        "Parse TSV as Array": function() {
            var csv = require("csv-streamify");
            return csv({objectMode: true, delimiter: "\t"});
        },

        "Filter Using Grep": function(filter /* Brooklyn|New York|San Francisco */) {
            // You don't actually want to do it this way...
            var cp = require("child_process");
            var es = require("event-stream");
            var grep = cp.exec("grep " + filter);
            return es.duplex(grep.stdin, grep.stdout);
        },

        "Convert Object w/ Handlebars": function(source /* <tr><td><a href='{{URL}}'>{{Name}}</a></td><td>{{City}}</td></tr>|<li><a href='{{URL}}'>{{Name}}</a> ({{City}})</li> */) {
            var Handlebars = require("handlebars");
            var es = require("event-stream");
            var tmpl = Handlebars.compile(source);
            return es.mapSync(tmpl);
        },
        
        "Convert Array w/ Sprintf": function(format /* <tr><td><a href='%2$s'>%1$s</a></td><td>%3$s</td></tr>|<li><a href='%2$s'>%1$s</a> (%3$s)</li>|%s,%s,"%s"|%s\t%s\t%s */) {
            var vsprintf = require("sprintf").vsprintf;
            var es = require("event-stream");
            return es.mapSync(function(data) {
                return vsprintf(format, data);
            });
        },

        "Convert Object w/ Sprintf": function(format /* <tr><td><a href='%(URL)s'>%(Name)s</a></td><td>%(City)s</td></tr>|<li><a href='%(URL)s'>%(Name)s</a> (%(City)s)</li>|%(Name)s,%(URL)s,"%(City)s"|%(Name)s\t%(URL)s\t%(City)s */) {
            var sprintf = require("sprintf").sprintf;
            var es = require("event-stream");
            return es.mapSync(function(data) {
                return sprintf(format, data);
            });
        }
    }
};
