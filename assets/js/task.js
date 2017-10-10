/* eslint-disable no-undef,no-unused-vars */
/* global $, tData, task, lastComment */

/* exported loadFileContent */
(function () {
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
    $('#confirmModalButtons').html(`<button type="button" class="btn btn-danger fileRemoveButton" data-removereply="` + reply + `" data-removeid="` + id + `">Skasuj</button>`)
    $('#confirmModal').modal()
    $('.fileRemoveButton').on('click', function () {
      const reply = $(this).data('removereply')
      const id = $(this).data('removeid')
      removeFile(reply, id)
    })
  }

  function replaceFile (reply, id, name, ext) {
    $('#confirmModalTitle').text('Podmiana pliku ' + name)
    $('#confirmModalBody').html(`<form action='/reply/` + reply + `/updateFile/` + id + `' enctype='multipart/form-data' method='post'>
  <input type='file' name='file' accept='.` + ext + `'>
  <input type="submit" value="Podmień plik" class="btn btn-primary"/>`)
    $('#confirmModalButtons').html('')
    $('#confirmModal').modal()
  }
  $('.replyFileIcon').on('click', function () {
    const reply = $(this).data('filereply')
    const id = $(this).data('fileid')
    loadFileContent(reply, id)
  })
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
          $('#fileContentModalRemove').on('click', function () {
            removeFileConfirm(reply, id, data.title)
          })
          $('#fileContentModalReplace').on('click', function () {
            replaceFile(reply, id, data.title, data.ext)
          })
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

function taskUp (idUp, place, topic) {
  console.log('start')
  let response = $.ajax({
    url: '/ajax/task/place',
    method: 'POST',
    data: {
      value: 'up',
      idUp: idUp,
      place: place,
      nextPlace: place,
      topic: topic
    }
  })
  var b4Place = parseInt(place)
  b4Place = b4Place - 1
  var b4 = $('#' + topic + b4Place)
  var a = $('#' + topic + place)
  // var spanb4 = $('#s' + topic + b4Place)
  // var spana = $('#s' + topic + place)
  console.log(b4)
  console.log(a)
  response.done(function () {
    b4.before(a)
    b4.attr('id', '' + topic + '' + place + '')
    // spanb4.unbind()
    // spanb4.attr('onclick', taskUp(idUp, place, topic))
    // spana.attr('onclick', taskUp(idUp, parseInt(place - 1), topic))
    a.attr('id', '' + topic + '' + b4Place + '')
  })
}
function taskDown (idDown, place, topic) {
  console.log('start')
  let response = $.ajax({
    url: '/ajax/task/place',
    method: 'POST',
    data: {
      value: 'down',
      idUp: idDown,
      place: place,
      nextPlace: place,
      topic: topic
    },
    error: function (request, status, error) {
      console.log(request.responseText)
    }
  })

  response.done(function () {
    console.log('ok')
  })
}

$('#del').on('click', function () {
  var data = $(this).data('id')
  var response = $.ajax({
    url: '/ajax/task/deleted',
    method: 'POST',
    data: {
      taskId: data
    }
  })

  response.done(function () {
    console.log('ok')
    // TODO: redirecta
    window.history.back()
  })
})

function delTopic (id) {
  console.log('start')
  var data = id
  var response = $.ajax({
    url: '/ajax/topic/deleted',
    method: 'POST',
    data: {
      topicId: data
    }
  })

  response.done(function () {
    console.log('done')
  })
}