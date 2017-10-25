/* eslint-disable no-unused-vars,no-global-assign,no-undef */

/* global topics, saved */
'use strict'

function repliesSelectTopic (id) {
  const topic = topics.filter(topic => topic.id === id)[0]
  if (topic) {
    saved = document.getElementById('tablebody').innerHTML
    let ret = '<tr><th><i onclick="repliesGetBack()" class="repliesGetBack fa fa-arrow-left fa-lg"></i></th><td class="wb-breakword">' + topic.number + '. ' + topic.title + '</td><td></td></tr><tr><td colspan="3"><div class="table-responsive"><table class="table table-striped table-hover"><tbody id="tablebody">'
    for (let taskn in topic.tasks) {
      const task = topic.tasks[taskn]
      ret += '<tr class="repliesTaskEntry" onclick="document.location=\'/teacher/replies/view/' + task.id + '\'"><td>' + task.id + '</td><td class="w-100 wb-breakword">' + task.number + '. ' + task.title + '</td><td></td></tr>'
    }
    ret += '</tbody></table></div></td></tr>'
    document.getElementById('tablebody').innerHTML = ret
  }
}

function repliesGetBack () {
  if (saved === '') {
    return
  }
  document.getElementById('tablebody').innerHTML = saved
}
(function () {
  $('.getLabTasksButton').on('click', function () {
    getLabTasks($(this).data('id'))
  })
  function getLabTasks (dataid) {
    const selected = $('#selectLab').val()
    $('#labs').html('<h3 id="labSpinner">Ładowanie <i class=\'fa fa-spinner fa-spin\'></i></h3>')
    let gets = []
    for (let s in selected) {
      gets.push($.get('/ajax/teacher/replies/view/' + dataid + '/lab/' + selected[s], function (data) {
        $('#labs').prepend(data)
        const replySortRows = $('.replySortRow')
        let sortable = []
        for (let i = 0; i <= replySortRows.length - 1; i++) {
          sortable[i] = Sortable.create(replySortRows[i], {
            animation: 150,
            forceFallback: true,
            handle: '.replySortHandle'
          })
        }
        $('.replySortableClose').on('click', function () {
          const closeCardId = $(this).data('closecard')
          const cardToClose = $('#studentCard-' + closeCardId)
          cardToClose.hide('slow', function () {
            cardToClose.remove()
          })
        })
        $('.dateSave').on('click', function () {
          const studentid = $(this).data('studentid')
          const taskid = $(this).data('taskid')
          saveDeadline(studentid, taskid)
        })
        $('.dateErase').on('click', function () {
          const studentid = $(this).data('studentid')
          const taskid = $(this).data('taskid')
          saveDeadline(studentid, taskid, true)
        })
        $('.setTeacherStatus').on('change', function () {
          const studentreplyid = $(this).data('studentreplyid')
          const value = parseInt($(this).val())
          setTeacherStatus(studentreplyid, value)
        })
        $('.setBlocked').on('change', function () {
          const studentid = $(this).data('studentid')
          const taskid = $(this).data('taskid')
          const studentreplyid = $(this).data('studentreplyid')
          const value = $(this).prop('checked')
          setBlocked(studentid, taskid, studentreplyid, value)
        })
        $('.repostTask').on('click', function () {
          const studentid = $(this).data('studentid')
          const taskid = $(this).data('taskid')
          const studentreplyid = $(this).data('studentreplyid')
          repostTask(studentid, taskid, studentreplyid)
        })
        $('.sendCommentButton').on('click', function () {
          const studentid = $(this).data('studentid')
          const taskid = $(this).data('taskid')
          sendComment(studentid, taskid)
        })
        $('.checkCommentsButton').on('click', function () {
          const studentid = $(this).data('studentid')
          const taskid = $(this).data('taskid')
          checkComments(studentid, taskid)
        })
      }))
    }
    $.when.apply($, gets).then(function () {
      $('#labSpinner').remove()
    }, function (jqXHR, textStatus, errorThrown) {
      alert('Nie udało się pobrać danych:  ' + textStatus + ' - ' + errorThrown) // todo: i18n
      $('#labSpinner').remove()
    })
    return false
  }

  function saveDeadline (student, task, del) {
    const deadline = $('#deadline-student-' + student + '-task-' + task)
    $.ajax({
      url: '/ajax/teacher/replies/setStudentDeadline/' + task,
      method: 'POST',
      data: {
        student: student,
        deadline: deadline.val(),
        remove: del
      }
    }).done(function () {
      if (del) {
        alert('Skasowano własny termin') // todo: i18n
      } else {
        alert('Ustawiono własny termin') // todo: i18n
      }
    })
      .fail(function (jqXHR, textStatus, errorThrown) {
        alert('Nie udało się zmienić terminu:  ' + textStatus + ' - ' + errorThrown) // todo: i18n
      })
  }

  function setTeacherStatus (id, value) {
    $.ajax({
      url: '/ajax/teacher/replies/setTeacherStatus/' + id,
      method: 'POST',
      data: {
        status: value
      }
    }).done(function () {
      let task = $('#reply-' + id)
      if (value === 0) {
        task.css('background-color', '')
      } else if (value === 1) {
        task.css('background-color', 'lightgreen')
      } else if (value === 2) {
        task.css('background-color', 'rgba(200,0,0,0.7)')
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
      alert('Nie udało się zmienić oceny:  ' + textStatus + ' - ' + errorThrown) // todo: i18n
    })
  }

  function setBlocked (student, task, id, checked) {
    $.ajax({
      url: '/ajax/teacher/replies/setBlocked/',
      method: 'POST',
      data: {
        blocked: checked,
        studentid: student,
        taskid: task
      }
    }).done(function () {
      let task = $('#reply-' + id)
      let btn = $('#repost-reply-' + id)
      if (checked) {
        if (btn) {
          btn.hide()
        }
        task.css('background-color', 'rgba(200,0,0,0.7)')
      } else {
        if (btn) {
          btn.show()
        }
        task.css('background-color', '')
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
      alert('Nie udało się zmienić blokady:  ' + textStatus + ' - ' + errorThrown) // todo: i18n
      // TODO: fix this
      // e.checked = !e.checked
    })
  }

  function repostTask (student, task, id) {
    $.ajax({
      url: '/ajax/teacher/replies/repostTask/',
      method: 'POST',
      data: {
        studentid: student,
        taskid: task
      }
    }).done(function () {
      $('#reply-' + id).css('background-color', 'rgba(100,100,100,0.7)')
      $('#repost-reply-' + id).remove()
    })
      .fail(function (jqXHR, textStatus, errorThrown) {
        alert('Nie udało się zresetować zadania:  ' + textStatus + ' - ' + errorThrown) // todo: i18n
      })
  }

  function sendComment (student, task) {
    const commentTextArea = $('#commentTextArea-' + student)
    let val = commentTextArea.val()
    commentTextArea.val('')
    if (!val || !val.trim()) {
      return
    }
    $('#loading-student-' + student).show()
    $.ajax({
      url: '/ajax/teacher/replies/sendComment/' + task,
      method: 'POST',
      data: {
        'student': student,
        'comment': val
      }
    }).done(function () {
      checkComments(student, task)
    })
  }
  function renderComment (student, id, name, surname, teacher, commentContent, date, read) {
    const tmplCommentAjax = $.templates('#tmplCommentAjax')

    return tmplCommentAjax.render({
      student: student,
      id: id,
      teacher: teacher,
      name: name + ' ' + surname,
      comment: commentContent,
      timestamp: date,
      read: read
    })
  }
  function checkComments (student, task) {
    const commentBlock = $('#comments-student-' + student)
    const last = commentBlock.data('last')
    $('#loading-student-' + student).show()
    $.ajax({
      url: '/ajax/teacher/replies/checkComments/' + task,
      method: 'POST',
      data: {
        'student': student,
        'last': last
      }
    }).done(function (data) {
      $('#loading-student-' + student).hide()
      if (data.error && data.error === 'noNew') {
        return
      }
      for (let id in data.comments) {
        let comment = data.comments[id]
        // todo: oznaczenie komentarzy jako read, jezeli ostatni zaladowany jest read
        commentBlock.append(renderComment(data.student, comment.id, comment.name, comment.surname, comment.teacher, comment.comment, comment.date, comment.viewed))
      }
      commentBlock.data('last', data.last)
      commentBlock.animate({
        scrollTop: commentBlock.prop('scrollHeight')
      }, 300)
    })
  }
})()
