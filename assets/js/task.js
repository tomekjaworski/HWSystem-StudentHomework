/* global $, tData, task, lastComment */

/* exported loadFileContent */

function removeFile (reply, id) {
  $.ajax({
    url: '/ajax/removeFile',
    method: 'POST',
    data: {
      reply: reply,
      id: id
    }
  }).done(function () {
    window.location.reload()
  })
  .fail(function (jqXHR, textStatus, errorThrown) {
    alert('Nie udało się skasować pliku:  ' + textStatus + ' - ' + errorThrown)
  })
}

function removeFileConfirm (reply, id, name) {
  $('#confirmModalTitle').text('Kasowanie pliku')
  $('#confirmModalBody').text('Czy na pewno chcesz skasować plik ' + name + '?')
  $('#confirmModalButtons').html(`<button type="button" class="btn btn-danger" onclick="removeFile(` + reply + `,` + id + `)">Skasuj</button>`)
  $('#confirmModal').modal()
}

function loadFileContent (reply, id) {
  // TODO: Seba dodaj jakiegoś ładnego spinnera ładowania
  $.getJSON('/ajax/reply/' + reply + '/loadFileContent/' + id)
    .done(function (data) {
      $('#fileContentModalTitle').text(data.title)
      $('#fileContentModalBody').html(data.body)
      $('#fileContentModalRemove').attr('onclick', 'removeFileConfirm(' + reply + ', ' + id + ', "' + data.title + '")')
      $('#fileContentModal').modal()
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      alert('Nie udało się wczytać danych: ' + textStatus + ' - ' + errorThrown)
    })
}

(function () {
  let newLastComment = null
  let markAsReadButton = $('#commentMarkAsRead')

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
      markAsReadButton.hide()
    })
  }

  function renderComment (author, comment, date, read) {
    let template = $('#commentAjaxTemplate').find('.list-group-item').clone()
    template.attr('id', 'commentFadeIn')
    template.find('.task-c-author').text(author)
    template.find('.task-c-timestamp').text(date)
    template.find('.task-c-comment').text(comment)
    template.find('.task-c-read').text(read)

    $(template).insertBefore(markAsReadButton)

    if (read === false) {
      markAsReadButton.fadeIn()
    }
    // if (markAsReadButton.style('display') === 'none') {
    //
    // } else {
    //   $('#commentArea').append(template)
    // }

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
    setTimeout(markAsRead, 200, tData.top, tData.tas)
    setTimeout(checkComments, 600)
  })

  $(markAsReadButton).on('click', function () {
    markAsRead(tData.top, tData.tas)
  })
  if (typeof (lastComment) !== 'undefined') {
    // checkComments()

    setInterval(function () {
      checkComments()
    }, 10000)
  }
})()
