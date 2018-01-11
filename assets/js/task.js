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
      window.location = location.pathname + '?msg=fileRemoveSuccess'
    })
      .fail(function (jqXHR, textStatus, errorThrown) {
        alert('Nie udało się skasować pliku:  ' + textStatus + ' - ' + errorThrown)
      })
  }

  function removeFileConfirm (reply, id, name) {
    let removeModal = $('.removeModal')

    if (removeModal.length > 0) {
      return false
    }

    const tmplRemoveModal = $.templates('#tmplRemoveModal')

    const renderedRemoveModal = tmplRemoveModal.render({name: name, reply: reply, id: id})

    $('#modalContainer').html(renderedRemoveModal)

    removeModal = $('#removeModal')
    removeModal.modal()

    removeModal.on('hidden.bs.modal', function () {
      $(this).remove()
    })

    $('.fileRemoveButton').on('click', function () {
      const reply = $(this).data('removereply')
      const id = $(this).data('removeid')
      removeFile(reply, id)
      removeModal.remove()
    })
  }
  $('.fileListRemove').on('click', function () {
    removeFileConfirm($(this).data('removereply'), $(this).data('removeid'), $(this).data('title'))
    return false
  })
  function replaceFile (reply, id, name, ext) {
    let replaceModal = $('.replaceModal')

    if (replaceModal.length > 0) {
      return false
    }
    const tmplReplaceModal = $.templates('#tmplReplaceModal')

    const renderedReplaceModal = tmplReplaceModal.render({name: name, reply: reply, id: id, ext: ext})

    $('#modalContainer').html(renderedReplaceModal)

    replaceModal = $('#replaceModal')

    replaceModal.modal()

    replaceModal.on('hidden.bs.modal', function () {
      $(this).remove()
    })
  }
  $('.replyFileIcon').on('click', function () {
    const reply = $(this).data('filereply')
    const id = $(this).data('fileid')
    loadFileContent(reply, id)
  })
  $('#fileReplyInput').on('change', function () {
    const fileReplyInput = $(this)[0]
    const fileReplySpan = $('#fileReplySpan')
    if (fileReplyInput.files) {
      if (fileReplyInput.files.length === 0) {
        fileReplySpan.addClass('fileReplyEmpty')
        fileReplySpan.text('')
      } else {
        fileReplySpan.removeClass('fileReplyEmpty')
        let fileReplySpanText = ''
        for (let i = 0; i < fileReplyInput.files.length; i++) {
          fileReplySpanText += (i + 1) + '/' + fileReplyInput.files.length + ': '
          const file = fileReplyInput.files[i]
          if (file.name) {
            fileReplySpanText += file.name + ', '
          }
          fileReplySpan.text(fileReplySpanText)
        }
      }
    }
  })
  function loadFileContent (reply, id) {
    // TODO: Seba dodaj jakiegoś ładnego spinnera ładowania
    $.getJSON('/ajax/reply/' + reply + '/loadFileContent/' + id)
      .done(function (data) {
        $('#fileContentModalTitle').text(data.title)
        if (data.mimeType.includes('text/')) {
          if (['h', 'c', 'hpp', 'cpp'].includes(data.ext)) {
            $('#fileContentModalBody').html(data.body)
          } else {
            $('#fileContentModalBody').html('<pre></pre>').find('pre').text(data.body)
          }
        } else if (data.mimeType === 'image/png') {
          $('#fileContentModalBody').html('<img class="img-fluid" src="data:image/png;base64,' + data.body + '"/>')
        } else if (data.mimeType === 'image/bmp') {
          $('#fileContentModalBody').html('<img class="img-fluid" src="data:image/bmp;base64,' + data.body + '"/>')
        } else {
          $('#fileContentModalBody').text('bad file ext') // TODO: i18n this
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
        alert('Nie udało się wczytać danych: ' + textStatus + ' - ' + errorThrown + (jqXHR.responseJSON ? '\n' + jqXHR.responseJSON : '')) // TODO: this into modal
      })
  }

  let newLastComment = null
  let markAsReadButton = $('#commentMarkAsRead')
  let commenticons = {
    read: '<span class="fa-stack fa-lg text-primary"><i class="fa fa-circle fa-stack-2x"></i><i class="fa fa-check fa-inverse fa-stack-1x"></i></span>',
    readSmall: '<span class="fa-stack text-primary"><i class="fa fa-circle fa-stack-2x"></i><i class="fa fa-check fa-inverse fa-stack-1x"></i></span>',
    unread: '<span class="fa-stack fa-lg"><i class="fa fa-circle-thin fa-stack-2x"></i></span>',
    unreadSmall: '<span class="fa-stack"><i class="fa fa-circle-thin fa-stack-2x"></i></span>'
  }

  // TODO: moze zsyncrhonizowac markasread miedzy oknami?
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
      $('.task-c-read').html(commenticons.read)
      $('.task-c-read-irc').html(commenticons.readSmall)
      markAsReadButton.hide()
      $('.commentsNotViewed').text('0')
    })
  }

  function renderComment (user, commentContent, date, read) {
    const tmplCommentAjax = $.templates('#tmplCommentAjax')

    const template = tmplCommentAjax.render({
      user: (!user ? false : user),
      teacher: (user ? user.isTeacher : false),
      name: (user ? user.name + ' ' + user.surname : ''),
      comment: commentContent,
      timestamp: date,
      read: read
    })

    markAsReadButton.before(template)

    const comment = $('#commentFadeIn')

    // // let template = $('#commentAjaxTemplate').find('.list-group-item').clone()
    // if (user) {
    //   let append = user.isTeacher ? '<span class="badge badge-primary">Prowadzący</span><span>&nbsp;napisał(a):</span>' : '<span>&nbsp;napisał(a):</span>'
    //   comment.find('.task-c-author').text(user.name + ' ' + user.surname).append(append)
    // } else {
    //   comment.find('.task-c-author').html('<span class="badge badge-info">Wiadomość systemowa</span>')
    // }
    // comment.find('.task-c-timestamp').text(date)
    // comment.find('.task-c-comment').text(commentContent)
    if ($('.task-c-read')[0]) {
      comment.find('.task-c-read').html((read ? commenticons.read : commenticons.unread))
    } else {
      comment.find('.task-c-read-irc').html((read ? commenticons.readSmall : commenticons.unreadSmall))
    }

    if (read === false) {
      markAsReadButton.fadeIn()
    }
    // if (markAsReadButton.style('display') === 'none') {
    //
    // } else {
    //   $('#commentArea').append(template)
    // }

    comment.fadeIn()
    comment.attr('id', '')
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
        if (msg[msg.length - 1].viewed) {
          markAsRead(tData.top, tData.tas)
        }
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
    let sendReplyModal = $('.sendReplyModal')

    if (sendReplyModal.length > 0) {
      return false
    }

    const tmplSendReplyModal = $.templates('#tmplSendReplyModal')

    const renderedSendReplyModal = tmplSendReplyModal.render({topic: $(this).data('topic'), task: $(this).data('task')})

    $('#modalContainer').html(renderedSendReplyModal)

    sendReplyModal = $('#sendReplyModal')
    sendReplyModal.modal()

    sendReplyModal.on('hidden.bs.modal', function () {
      $(this).remove()
    })

    sendReplyModal.modal()
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
