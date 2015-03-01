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
    S = require('string');

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

var list = { };
function buildlist() {
  list = { };
  fs.readdir("presets/", function(err, files) {
    files.forEach(function(file) {
      fs.readFile("presets/" + file, function(err, data) {
        try {
          var item = JSON.parse(data, function (key, value) {
            if (value && (typeof value === 'string') && value.indexOf("function") === 0) {
                // we can only pass a function as string in JSON ==> doing a real function
                var jsFunc = new Function('return ' + value)();
                return jsFunc;
            }

            return value;
          });
          item.id = path.basename(file, '.json');
          list[item.id] = item;
        } catch (err) {
          console.error("Error parsing " + path.basename(file, '.json') + ":\r\n" + err.message + err.stack);
        }
      });
    });
  });
}
buildlist();

// API requests
app.use('/api/asm/list', function(req, res) {
  //list all assembly presets
  console.log(list);
  sendjson(list, res);
});
app.use('/api/asm', function(req, res) {
  //assemble
  if (list[req.query.type] === undefined) { sendjson({text: "Error compiling: preset not specified"}, res); }

  var format = list[req.query.type];
  var s = req.query.text;
  var text = ""; //text output
  //TODO logisim output

  var j = s.toString().split("\n");
  j.forEach(function(line) {
    console.log("TEST");
    line = S(line).trim().toString();
    //TODO remove everything after a semicolon
    var words = line.match(/\w+/ig);
    //TODO remove "h" from the ends of words and convert these to hex
    if (words != null) {
      var out = [ 'ER', "instruction not found"];
      if (format.ops[words[0]] !== undefined)
      {
        if (format.ops[words[0]].minargs <= words.length - 1)
        {
          var inst = format.ops[words[0]].result;
          var l = words.length;
          if (!(inst === undefined | inst == null)) {
            console.log(words);
            console.log(inst);
            if (l == 1) { out = inst(); }
            else if (l == 2) { out = inst(words[1]); }
            else if (l == 3) { out = inst(words[1], words[2]); }
            else if (l == 4) { out = inst(words[1], words[2], words[3]); }
            else if (l == 5) { out = inst(words[1], words[2], words[3], words[4]); }
            else if (l == 6) { out = inst(words[1], words[2], words[3], words[4], words[5]); }
            else { out = [ 'ER', "too many parameters" ]; }
          }
        } else { out = [ 'ER', "too few parameters" ]; }
      }
      text = text + out[0].toString() + "  ;" + out[1].toString() + "\r\n";
    }
  });
  sendjson({text: text}, res);

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
