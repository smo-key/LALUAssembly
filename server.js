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

function convertBase(num, baseFrom, baseTo) {
  return parseInt(num, baseFrom).toString(baseTo);
};

function bits(hex, base) {
  //get the length of a hexadecimal number in bits
  return convertBase(hex, base, 2).length;
}

function gettype(s) {
  //number recognition
  var hex = /^([a-f\d]+h)/i;
  var binary1 = /^[01]+b/i;
  var binary2 = /^0x[01]+/i;
  var dec = /^\d+/i;
  var bool = /^(true|false)/i;
  if (hex.test(s))
  {
    s = s.substring(0, s.length - 1);
    return [ s, bits(s, 16) ];
  }
  else if (binary1.test(s))
  {
    s = s.substring(0, s.length - 1);
    return [ convertBase(s, 2, 16), bits(s, 2) ];
  }
  else if (binary2.test(s))
  {
    s = s.substring(2, s.length);
    return [ convertBase(s, 2, 16), bits(s, 2) ];
  }
  else if (dec.test(s))
  {
    return [ convertBase(s, 10, 16), bits(s, 10) ];
  }
  else if (bool.test(s))
  {
    if (s == "true") { return ["1", 1]; }
    if (s == "false") { return ["0", 1]; }
  }
  else
  {
    return undefined;
  }
}

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
    line = S(line).trim().toString();
    //TODO remove everything after a semicolon
    var words = line.match(/\w+/ig);
    //TODO remove "h" from the ends of words and convert these to hex
    if (words != null) {
      var out = [ 'ER', "instruction '" + words[0] + "' not found"];
      if (format.ops[words[0]] !== undefined)
      {
        if (format.ops[words[0]].args !== undefined)
        {
          var minargs = 0;
          var donecounting = false;
          var args = format.ops[words[0]].args;
          args.forEach(function(arg) {
            if (!donecounting && arg.req) { minargs++; } else
            { donecounting = true; }
          });
          if (minargs <= words.length - 1)
          {
            //test if args are compatible with input
            var argsok = true;
            for (var i = 0; i < args.length; i++) {
              var wrd = words[i + 1];
              var type = gettype(wrd);
              console.log(wrd);
              console.log(type);
              if (type === undefined)
              {
                out = [ 'ER', "unknown parameter '" + wrd + "'" ];
                argsok = false;
                break;
              }
              else if (args[i].maxbits !== undefined)
              {
                if (type[1] > args[i].maxbits)
                {
                  out = [ 'ER', "'" + wrd + "' greater than " + args[i].maxbits + " bits" ];
                  argsok = false;
                  break;
                }
                else { words[i + 1] = type[0]; }
              }
              else { words[i + 1] = type[0]; }
            }
            if (argsok) {
              var inst = format.ops[words[0]].result;
              var l = words.length;
              if (!(inst === undefined | inst == null)) {
                if (l == 1) { out = inst(); }
                else if (l == 2) { out = inst(words[1]); }
                else if (l == 3) { out = inst(words[1], words[2]); }
                else if (l == 4) { out = inst(words[1], words[2], words[3]); }
                else if (l == 5) { out = inst(words[1], words[2], words[3], words[4]); }
                else if (l == 6) { out = inst(words[1], words[2], words[3], words[4], words[5]); }
                else { out = [ 'ER', "too many parameters" ]; }
              }
            }
          } else { out = [ 'ER', "too few parameters" ]; }
        }
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
      fragment: 'assembler',
      assemblerin: 'assemblerin',
      assemblerout: 'assemblerout'
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
