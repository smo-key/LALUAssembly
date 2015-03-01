resize();
getlist();

var cm1 = CodeMirror.fromTextArea(document.getElementById("code-lalu"), {
  lineNumbers: true,
  mode:  "lalu"
});
var cm2 = CodeMirror.fromTextArea(document.getElementById("code-text"), {
  lineNumbers: true,
  mode:  "binary",
  readOnly: true,
  lineNumberFormatter: function(i) {
    return (i-1).toString(16) + "h";
  }
});
$('.CodeMirror').eq(0).addClass("input");
$('.CodeMirror').eq(1).addClass("output");
$('#compilestatus').css("display", "none");

$('.CodeMirror.input').change(function() { changeCode(); });
$('#assemblystyle').change(function() { changeCode(); });

$(window).resize(function() { resize(); });

function getlist() {
  $.ajax({
    url: "/api/asm/list",
    type: "GET",
    success: function(data) {
      data.forEach(function(s, i) {
        $('#assemblystyle').append('<option value="' + s.id + '">' + s.name + '</option>');
      });
    },
    failure: function() {
       $('#assemblystyle').append('<option value=-1>Default</option>');
    }
  });
}

function resize() {
  var w = $(window).width();
  var h = $(window).height();
  if (w < 768) { $('.fragment').height(h/2 - $('navbar').height() - 32); }
  else { $('.fragment').height(h - $('navbar').height() - 64); }
}
function changeCode() {
  $('#compilestatus').css("display", "block");
  $('#downloadbutton').css("display", "none");

}
