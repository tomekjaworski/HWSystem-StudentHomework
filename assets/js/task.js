/* global $, tData */

function markAsRead (topic, task, taskReply) {
  let response = $.ajax({
    url: '/topic/' + topic + '/task/' + task,
    method: 'POST',
    data: {
      'taskReply': taskReply,
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
  template.find('.task-c-author').html(author)
  template.find('.task-c-timestamp').html(date)
  template.find('.task-c-comment').html(comment)
  template.find('.task-c-read').html(read)

  $('#commentArea').append(template)

  const commentFadeIn = $('#commentFadeIn')
  commentFadeIn.fadeIn()
  commentFadeIn.attr('id', '')
}
function sendComment (topic, task, taskReply) {
  let response = $.ajax({
    url: '/topic/' + topic + '/task/' + task,
    method: 'POST',
    data: {
      'taskReply': taskReply,
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
  sendComment(tData.top, tData.tas, tData.tasRep)
  markAsRead(tData.top, tData.tas, tData.tasRep)
})

$('#commentMarkAsRead').on('click', function () {
  markAsRead(tData.top, tData.tas, tData.tasRep)
})
