var md = window.markdownit();

$('#description').on('keyup', function () {
  var text = $(this).val();
  var result = md.render(text);
  $('#mdown').html(result);
  $(document).ready(function() {
    $('pre code').each(function(i, block) {
      hljs.highlightBlock(block);
    });
  });
});
