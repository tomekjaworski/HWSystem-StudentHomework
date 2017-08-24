/* global $, tData */
(function () {
  function markAsRead (topic, task) {
    let response = $.ajax({
      url: '/topic/' + topic + '/task/' + task,
      method: 'POST',
      data: {
        'task': task,
        'action': 'markAsRead'
      }
    })

    response.done(function (msg) {
      // console.log(msg)
    })
  }

  function renderComment (author, comment, date, read) {
    let template = $('#commentAjaxTemplate').find('.list-group-item').clone()
    template.attr('id', 'commentFadeIn')
    template.find('.task-c-author').text(author)
    template.find('.task-c-timestamp').text(date)
    template.find('.task-c-comment').text(comment)
    template.find('.task-c-read').text(read)

    $('#commentArea').append(template)

    const commentFadeIn = $('#commentFadeIn')
    commentFadeIn.fadeIn()
    commentFadeIn.attr('id', '')
  }

  function sendComment (topic, task) {
    let response = $.ajax({
      url: '/topic/' + topic + '/task/' + task,
      method: 'POST',
      data: {
        'action': 'sendComment',
        'comment': $('#commentTextArea').val()
      }
    })

    response.done(function () {
      const commentTextArea = $('#commentTextArea')
      const comment = commentTextArea.val()
      // console.log(comment)
      renderComment('me', comment, 'now', 'przeczytane')
      commentTextArea.val('')
    })
  }

  $('#commentSendButton').on('click', function () {
    sendComment(tData.top, tData.tas)
    markAsRead(tData.top, tData.tas)
  })

  $('#commentMarkAsRead').on('click', function () {
    markAsRead(tData.top, tData.tas)
  })
})()
