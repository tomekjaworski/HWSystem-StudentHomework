/* global $, tData, task, lastComment */
(function () {
  let newLastComment = null

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
      commentTextArea.val('')
    })
  }
  function checkComments (sent) {
    if (newLastComment === null) {
      newLastComment = lastComment
    }
    let commentId = null
    if (sent) {
      commentId = newLastComment - 1
    } else {
      commentId = newLastComment
    }
    let response = $.ajax({
      url: '/ajax/checkComments/' + task + '/' + commentId,
      method: 'GET'
      // data: {
      //   'action': 'checkComments',
      //   'task': task,
      //   'lastComment': lastComment
      // }
    })
    response.done(function (msg) {
      for (let i = 0; i <= msg.length - 1; i++) {
        renderComment(msg[i].user.name + ' ' + msg[i].user.surname, msg[i].comment, msg[i].createdAt, msg[i].viewed)
        newLastComment = msg[i].id
      }
    })
  }
  // $(window).load(checkComments())
  $('#commentSendButton').on('click', function () {
    sendComment(tData.top, tData.tas)
    setTimeout(checkComments(), 1000)
    setTimeout(markAsRead(tData.top, tData.tas), 1000)
  })

  $('#commentMarkAsRead').on('click', function () {
    markAsRead(tData.top, tData.tas)
  })
  if (typeof (lastComment) !== 'undefined') {
    // checkComments()

    setInterval(function () {
      checkComments()
    }, 100000)
  }
})()
