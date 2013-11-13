
/**
 * Module dependencies.
 */

var express = require("express");
var http = require("http");
var path = require("path");

var app = express();

var settings = {
    port: process.env.PORT || 8945
};

var routes = require("./routes")(settings);

// all environments
app.set("port", settings.port);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.favicon());
app.use(express.logger("dev"));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, "public")));

// development only
if ("development" == app.get("env")) {
    app.use(express.errorHandler());
}

// Utility method of setting the cache header on a request
// Used as a piece of Express middleware
var cache = function(hours) {
    return function(req, res, next) {
        if (process.env.NODE_ENV === "production") {
            res.setHeader("Cache-Control", "public, max-age=" + (hours * 3600));
        }
        next();
    };
};

app.get("/", cache(1), routes.index);
app.post("/", routes.runCode);

http.createServer(app).listen(app.get("port"), function(){
    console.log("Server listening on port " + app.get("port"));
});
