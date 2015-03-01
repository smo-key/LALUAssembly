// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('binary', function() {
  var numbers = /^(\d+)\b/i;

  return {
    startState: function() {
      return {context: 0};
    },
    token: function(stream, state) {
      if (!stream.column())
        state.context = 0;

      if (stream.eatSpace())
        return null;

      var w;

      if (stream.eatWhile(/\w/)) {
        w = stream.current();
        if (numbers.test(w)) {
          return 'number';
        }
      } else if (stream.eat(';')) {
        stream.skipToEnd();
        return 'comment';
      } else {
        stream.next();
      }
      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-binary", "binary");

});
