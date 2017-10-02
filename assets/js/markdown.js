$('body').ready(function () {
  const taskDescEdit = $('#taskDescEditor')
  if (taskDescEdit[0]) {
    // eslint-disable-next-line no-unused-vars
    const simplemde = new SimpleMDE({
      element: taskDescEdit[0],
      renderingConfig: {
        singleLineBreaks: true,
        codeSyntaxHighlighting: true
      },
      spellChecker: false,
      toolbar: [
        'bold', 'italic', 'strikethrough', 'heading',
        '|',
        'code', 'quote', 'unordered-list', 'ordered-list',
        '|',
        'horizontal-rule', 'table', 'link', 'image',
        '|',
        'preview', 'side-by-side', 'fullscreen',
        '|',
        'guide'
      ],
      forceSync: true
    })
  }
})
