//instantiate variables
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    express = require("express"),
    yaml = require("js-yaml"),
    cons = require('consolidate'),
    logger = require('morgan'),
    bodyParser = require("body-parser"),
    cookieparser = require('cookie-parser');

//initialize renderer
var app = express();
var router = express.Router();
var server = require('http').Server(app);
app.engine('html', cons.mustache);
app.set('view engine', 'html');
app.set("view options", {layout: false});
app.set('views', __dirname + '/partials');

//JSON parsing
function sendjson(json, res)
{
  var s = JSON.stringify(json);
  res.writeHead(200, { 'Content-Type': 'application/json',
                       'Content-Length': s.length });
  res.end(s);
  res.send();
}

/* GET PROCESS INFORMATION */
configname = process.argv[2] || "config.yml";

/* READ SERVER CONFIG */
configdata = fs.readFileSync(configname);
config = yaml.safeLoad(configdata);
config.port = config.port || 8000; //server port

/* EXPRESS */
app.use(logger('dev'));

app.param(function(name, fn){
  if (fn instanceof RegExp) {
    return function(req, res, next, val){
      var captures;
      if (captures = fn.exec(String(val))) {
        req.params[name] = captures;
        next();
      } else {
        next('route');
      }
    }
  }
});

//APP USAGE PARAMS
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieparser());

/* SERVER */

// API requests
app.use('/api/asm/list', function(req, res) {
  //list all assembly presets
  var list = [{ name: "Arthur-Brandon", id: 'ab' },
              { name: "Mueller", id: 'mulr' } ];
  sendjson(list, res);
});
app.use('/api/asm', function(req, res) {
  //assemble
});

// Fragment requests
app.get('/asm', function (req, res) {

});
app.get('/docs', function (req, res) {

});

app.get('/', function (req, res) {
  res.render('index', {
    partials: {
      fragment: 'assembler'
    }
  });
});

app.use('/css', express.static(__dirname + '/css'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use('/js', express.static(__dirname + '/js'));

// Handle 404
app.use(function(req, res) {
  //TODO handle
});

// Handle 500
app.use(function(err, req, res, next) {
  res.status(500);
  console.log(err.stack);
  //TODO handle
});

//serve HTTP
server.listen(config.port);

console.log("Server ready on port " + config.port);
