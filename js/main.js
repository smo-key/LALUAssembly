var cm1 = CodeMirror.fromTextArea(document.getElementById("code-lalu"), {
  lineNumbers: true,
  mode:  "lalu"
});
var cm2 = CodeMirror.fromTextArea(document.getElementById("code-text"), {
  lineNumbers: true,
  mode:  "text",
  readOnly: true
});
$('.CodeMirror').eq(0).addClass("one");
$('.CodeMirror').eq(1).addClass("two");
