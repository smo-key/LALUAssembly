resize();
getlist();

var input = CodeMirror.fromTextArea(document.getElementById("code-lalu"), {
  lineNumbers: true,
  mode:  "lalu"
});
var output = CodeMirror.fromTextArea(document.getElementById("code-text"), {
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

input.on("changes", function() {
   changeCode();
});
$('#assemblystyle').change(function() { changeCode(); });
$('#downloadbutton').click(function() { assemble(); });

$(window).resize(function() { resize(); });

function getlist() {
  $('#downloadbutton').prop("disabled", true);
  $.ajax({
    url: "/api/asm/list",
    type: "GET",
    success: function(data) {
      $.each(data, function(k, v) {
        $('#assemblystyle').append('<option value="' + k + '">' + v.name + '</option>');
      });
      $('#downloadbutton').prop("disabled", false);
    },
    failure: function() {
       $('#assemblystyle').append('<option value=-1>Default</option>');
    }
  });
}

var binary_logisim = "";

function assemble() {
  $.ajax({
    url: "/api/asm",
    type: "GET",
    data: { type: $('#assemblystyle').val(), text: input.getValue() },
    success: function(data) {
      output.setValue(data.text);
      binary_logisim = data.logisim;
    },
    failure: function() {
      console.error("ERROR!");
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
  console.log("FIRED!");

  assemble();
}
