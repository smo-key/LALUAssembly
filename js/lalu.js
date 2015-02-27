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

CodeMirror.defineMode('lalu', function() {
  var keywords1 = /^(add|sub|ld|exc|sto|jmp|jin)\b/i;
  var variables1 = /^((a|b)x?)\b/i;
  var numbers = /^([\da-f]+h|[01]+b|\d+)\b/i;

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
        console.log(w);
        if (keywords1.test(w)) {
          state.context = 1;
          return 'keyword';
        }
        else if (variables1.test(w)) {
          return 'variable-2';
        }
        else if (numbers.test(w)) {
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

CodeMirror.defineMIME("text/x-lalu", "lalu");

});
