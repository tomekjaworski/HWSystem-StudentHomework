/* eslint-disable no-unused-vars,no-global-assign,no-undef */

/* global topics, saved */
'use strict'

function repliesSelectTopic (id) {
  const topic = topics.filter(topic => topic.id === id)[0]
  if (topic) {
    saved = document.getElementById('tablebody').innerHTML
    let ret = '<tr><td class="wb-breakword"><i onclick="repliesGetBack()" class="repliesGetBack fa fa-arrow-left fa-lg"></i> ' + topic.number + '. ' + topic.title + '</td><th>' + id + '</th></tr><tr><td colspan="3"><div class="table-responsive"><table class="table table-striped table-hover"><tbody id="tablebody">'
    for (let taskn in topic.tasks) {
      const task = topic.tasks[taskn]
      ret += '<tr class="repliesTaskEntry" onclick="document.location=\'/teacher/replies/view/' + task.id + '\'"><td class="w-100 wb-breakword">' + task.number + '. ' + task.title + '</td><td>' + task.id + '</td></tr>'
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

let setButtons;

(function () {
  const table = $('#getLabTasks')
  const filterSelect = $('#getLabTasksMode')

  setButtons = function (node) {
    node.find('.replySortableClose').on('click', function () {
      const closeCardId = $(this).data('closecard')
      const cardToClose = $('#studentCard-' + closeCardId)
      cardToClose.hide('slow', function () {
        cardToClose.remove()
      })
    })
    node.find('.dateSave').on('click', function () {
      const studentid = $(this).data('studentid')
      const taskid = $(this).data('taskid')
      saveDeadline(studentid, taskid)
    })
    node.find('.dateErase').on('click', function () {
      const studentid = $(this).data('studentid')
      const taskid = $(this).data('taskid')
      saveDeadline(studentid, taskid, true)
    })
    node.find('.setTeacherStatus').find('button').on('click', function () {
      const studentreplyid = $(this).data('studentreplyid')
      const value = parseInt($(this).data('val'))
      setTeacherStatus(studentreplyid, value)
    })
    node.find('.setBlocked').on('change', function () {
      const studentid = $(this).data('studentid')
      const taskid = $(this).data('taskid')
      const studentreplyid = $(this).data('studentreplyid')
      const value = $(this).prop('checked')
      setBlocked(studentid, taskid, studentreplyid, value)
    })
    node.find('.repostTask').on('click', function () {
      const studentid = $(this).data('studentid')
      const taskid = $(this).data('taskid')
      const studentreplyid = $(this).data('studentreplyid')
      repostTask(studentid, taskid, studentreplyid)
    })
    node.find('.sendCommentButton').on('click', function () {
      const studentid = $(this).data('studentid')
      const taskid = $(this).data('taskid')
      sendComment(studentid, taskid)
    })
    node.find('.checkCommentsButton').on('click', function () {
      const studentid = $(this).data('studentid')
      const taskid = $(this).data('taskid')
      checkComments(studentid, taskid)
    })
  }

  let LabsLoader = new function () {
    this.labs = []
    this.renderDOM = $('#labs')
    this.buttons = $('a.btn.btn-secondary.next-prev')
    this.requests = []
    this.mode = 1
    this._ajax = (id, task) => {
      let _this = this
      let req = this.requests.filter(l => l.id === id)
      if (req.length !== 0) {
        req.forEach(r => r.req.abort())
      }
      this.requests.push({
        id: id,
        req: $.get('/ajax/teacher/replies/view/' + task + '/lab/' + id + '/?select=' + this.mode, function (data) {
          if (_this.labs.find(l => l.id === id) === undefined) {
            return
          }
          _this.requests.splice(_this.requests.map(r => r.id).indexOf(id), 1)
          _this.replaceContent(id, data)
          _this.setButtons(id)
          const replySortRows = $('.replySortRow')
          let sortable = []
          for (let i = 0; i <= replySortRows.length - 1; i++) {
            sortable[i] = Sortable.create(replySortRows[i], {
              animation: 150,
              forceFallback: true,
              handle: '.replySortHandle'
            })
          }
        }).fail(function (jqXHR, textStatus, errorThrown) {
          if (textStatus === 'abort') {
            return
          }
          alert('Nie udało się pobrać danych:  ' + textStatus + ' - ' + errorThrown) // todo: i18n
          if (_this.labs.find(l => l.id === id) === undefined) {
            return
          }
          _this.replaceContent(id, '<h5>Błąd wczytywania danych</h5>')
        })
      })
    }
    this.setMode = (mode) => {
      this.mode = mode
      if (this.labs.length > 0) {
        for (let lab of this.labs) {
          lab.node = $($.parseHTML('<h3>Ładowanie ' + lab.name + '  <i class=\'fa fa-spinner fa-spin\'></i></h3>'))
        }
        this.render()
        for (let lab of this.labs) {
          this._ajax(lab.id, lab.task)
        }
      }
    }
    this.addLab = (id, task, name, first) => {
      this.labs.push({
        id: id,
        first: first,
        node: $($.parseHTML('<h3>Ładowanie ' + name + '  <i class=\'fa fa-spinner fa-spin\'></i></h3>')),
        name: name,
        task: task
      })
      this.render()
      this._ajax(id, task)
    }
    this.replaceContent = (id, html) => {
      this.labs.find(l => l.id === id).node = $($.parseHTML(html))
      this.render()
    }
    this.setButtons = (id) => {
      let lab = this.labs.find(l => l.id === id).node
      setButtons(lab)
    }
    this.removeLab = (id) => {
      this.labs.splice(this.labs.map(l => l.id).indexOf(id), 1)
      let req = this.requests.filter(l => l.id === id)
      if (req.length !== 0) {
        req.forEach(r => r.req.abort())
      }
      this.render()
    }
    this.render = () => {
      this.labs.sort((a, b) => a.first && b.first
        ? a.name.localeCompare(b.name)
        : a.first ? false
          : b.first ? true
            : a.name.localeCompare(b.name))
      this.renderDOM.html(this.labs.map(l => l.node))
      for (let lab of this.labs) {
        let scroll1 = lab.node.find('#scroll-' + lab.id)
        let scroll2 = lab.node.find('#scroll2-' + lab.id)
        if (scroll1.length && scroll2.length) {
          scroll1.find('div').css('width', scroll2[0].scrollWidth)
          scroll1.scroll(function () {
            scroll2
              .scrollLeft(scroll1.scrollLeft())
          })
          scroll2.scroll(function () {
            scroll1
              .scrollLeft(scroll2.scrollLeft())
          })
        }
      }
      let labHref = ''
      if (this.labs.length > 0) {
        labHref = '?labs=' + this.labs.map(l => l.id).join() + '&mode=' + this.mode
      }
      for (let btn of this.buttons) {
        let href = btn.href.split('?')
        btn.href = href[0] + labHref
      }
    }
  }()

  filterSelect.on('change', function () {
    LabsLoader.setMode($(this).val())
  })

  table.find('tr').on('click', function () {
    let tr = $(this)
    if (tr.hasClass('table-info')) {
      tr.removeClass('table-info')
      let labId = tr.data('id')
      LabsLoader.removeLab(labId)
    } else {
      tr.addClass('table-info')
      let labId = tr.data('id')
      let labName = tr.data('name')
      let first = !!tr.data('first')
      let task = table.data('task')
      LabsLoader.addLab(labId, task, labName, first)
    }
  })

  let params = {}
  location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) { params[k] = v })
  if (params['labs']) {
    let labs = params['labs'].split(',')
    let mode = parseInt(params['mode'], '10')
    if (mode >= 1 && mode <= 6) {
      filterSelect.val(mode)
      LabsLoader.setMode(mode)
      for (let lab of labs) {
        table.find('tr[data-id="' + lab + '"]').click()
      }
    }
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
      let buttons = $('.setTeacherStatus[data-studentreplyid=' + id + ']')
      if (value === 0) {
        task.css('background-color', '')
        buttons.find('.acc').removeClass('btn-success').addClass('btn-outline-success')
        buttons.find('.dec').removeClass('btn-danger').addClass('btn-outline-danger')
        buttons.find('.non').removeClass('btn-outline-primary').addClass('btn-primary')
      } else if (value === 1) {
        task.css('background-color', 'lightgreen')
        buttons.find('.acc').removeClass('btn-outline-success').addClass('btn-success')
        buttons.find('.dec').removeClass('btn-danger').addClass('btn-outline-danger')
        buttons.find('.non').removeClass('btn-primary').addClass('btn-outline-primary')
      } else if (value === 2) {
        task.css('background-color', 'rgba(150,0,0,0.5)')
        buttons.find('.acc').removeClass('btn-success').addClass('btn-outline-success')
        buttons.find('.dec').removeClass('btn-outline-danger').addClass('btn-danger')
        buttons.find('.non').removeClass('btn-primary').addClass('btn-outline-primary')
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
      $('#replyTeacherStatus-' + id).html('<b>Odpowiedź nie jest ostateczna, student musi przesłać odpowiedź ponownie! Ukazane pliki mogą nie być najnowsze.</b>')
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
