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

function replaceFile (reply, id, name, ext) {
  $('#confirmModalTitle').text('Podmiana pliku ' + name)
  $('#confirmModalBody').html(`<form action='/reply/` + reply + `/updateFile/` + id + `' enctype='multipart/form-data' method='post'>
<input type='file' name='file' accept='.` + ext + `'>
<input type="submit" value="Podmień plik" class="btn btn-primary"/>`)
  $('#confirmModalButtons').html('')
  $('#confirmModal').modal()
}

function loadFileContent (reply, id) {
  // TODO: Seba dodaj jakiegoś ładnego spinnera ładowania
  $.getJSON('/ajax/reply/' + reply + '/loadFileContent/' + id)
    .done(function (data) {
      $('#fileContentModalTitle').text(data.title)
      if (data.mimeType.includes('text/')) {
        $('#fileContentModalBody').html(data.body)
      } else if (data.mimeType === 'image/png') {
        $('#fileContentModalBody').html('<img class="img-fluid" src="data:image/png;base64,' + data.body + '"/>')
      } else if (data.mimeType === 'image/bmp') {
        $('#fileContentModalBody').html('<img class="img-fluid" src="data:image/bmp;base64,' + data.body + '"/>')
      } else {
        $('#fileContentModalBody').text('Nieobsługiwane rozszerzenie')
      }
      if (!replySent) {
        $('#fileContentModalRemove').attr('onclick', 'removeFileConfirm(' + reply + ', ' + id + ', "' + data.title + '")')
        $('#fileContentModalReplace').attr('onclick', 'replaceFile(' + reply + ', ' + id + ', "' + data.title + '", "' + data.ext + '")')
      } else {
        $('#fileContentModalRemove').hide()
        $('#fileContentModalReplace').hide()
      }
      $('#fileContentModalDownload').attr('href', '/downloadFile/' + id)
      $('#fileContentModal').modal()
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      alert('Nie udało się wczytać danych: ' + textStatus + ' - ' + errorThrown + (jqXHR.responseJSON ? '\n' + jqXHR.responseJSON : ''))
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
      $('.task-c-read').text('przeczytane')
      markAsReadButton.hide()
    })
  }

  function renderComment (user, comment, date, read) {
    let template = $('#commentAjaxTemplate').find('.list-group-item').clone()
    template.attr('id', 'commentFadeIn')
    if (user) {
      let append = user.isTeacher ? '<span class="badge badge-primary">Prowadzący</span><span>&nbsp;napisał(a):</span>' : '<span>&nbsp;napisał(a):</span>'
      template.find('.task-c-author').text(user.name + ' ' + user.surname).append(append)
    } else {
      template.find('.task-c-author').html('<span class="badge badge-info">Wiadomość systemowa</span>')
    }
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
    let val = $('#commentTextArea').val()
    if (!val) {
      return
    }
    let response = $.ajax({
      url: '/topic/' + topic + '/task/' + task,
      method: 'POST',
      data: {
        'action': 'sendComment',
        'comment': val
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
        renderComment(msg[i].user, msg[i].comment, msg[i].createdAt, msg[i].viewed)
        newLastComment = msg[i].id
      }
      if (msg.length >= 1) {
        markAsReadButton.show()
      }
    })
  }

  // $(window).load(checkComments())
  $('#commentSendButton').on('click', function () {
    sendComment(tData.top, tData.tas)
    setTimeout(markAsRead, 200, tData.top, tData.tas)
    setTimeout(checkComments, 600)
  })
  $('#sendReply').on('click', function () {
    $('#confirmModalTitle').text('Wysłanie rozwiązania')
    $('#confirmModalBody').html('Czy na pewno chcesz wysłać rozwiązanie? <br><b>Późniejsza edycja będzie niemożliwa!</b>')
    $('#confirmModalButtons').html(`<a href='/topic/` + $(this).data('topic') + `/task/` + $(this).data('task') + `/sendReply/' class='btn btn-primary'>Wyślij rozwiązanie</a>`)
    $('#confirmModal').modal()
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
