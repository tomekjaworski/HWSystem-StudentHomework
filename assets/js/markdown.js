var md = window.markdownit();

$('#description').on('change', function () {
  var text = $(this).val();
  var result = md.render(text);
  $('#test').html(result);

});
