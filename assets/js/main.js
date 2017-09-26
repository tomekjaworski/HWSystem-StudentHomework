/* global $, history, location, taskView, currenttopic */

(function () {
  const formbutton = $('#nav-form-button')
  const formregister = $('#nav-form-register')
  const emailfield = $('#nav-form-email')
  const passfield = $('#nav-form-pass')
  const navform = $('#nav-form')
  const currenttopiclink = $('#bc-current-topic-link')

  formbutton.on('click', function () {
    const regexEmail = /^\w+@(p\.lodz\.pl)|\w+@(edu\.p\.lodz\.pl)$/

    if (navform.data('step') === 0) {
      formregister.hide()
      emailfield.show()
      emailfield.focus()

      $(this).removeClass('btn-outline-success')
      $(this).addClass('btn-outline-primary')
      $(this).val('Next')

      navform.data('step', 1)
      // console.log(navform.data('step'))
    } else {
      if (regexEmail.test(emailfield.val())) {
        if ((passfield.val() !== '') && (navform.data('step') === 2)) {
          $(this).attr('type', 'submit')
          $(this).submit()
        } else if (navform.data('step') === 1) {
          navform.removeClass('has-danger')
          emailfield.hide()
          passfield.show()
          passfield.focus()

          $(this).addClass('btn-outline-success')
          $(this).removeClass('btn-outline-primary')
          $(this).val('Login')

          // console.log(navform.data('step'))
          navform.data('step', 2)
        }
      } else {
        // console.log(navform.data('step'))
        navform.addClass('has-danger')
      }
    }
  })

  emailfield.keydown(function (handler) {
    if (handler.keyCode === 13) {
      formbutton.click()
    }
  })

  passfield.keydown(function (handler) {
    if (handler.keyCode === 13) {
      formbutton.click()
    }
  })

  $('.button-topicview').click(function (event) {
    event.preventDefault()
    loadTaskView($(this).data('topicid'))
    return false
  })

  function loadTaskView (topicid) {
    const topicscolumn = $('#topics-column')
    const taskscolumn = $('#tasks-column')
    const bctopics = $('#bc-topics')
    const bccurrenttopic = $('#bc-current-topic')
    const topicentryactive = $('.topic-entry-active')

    topicscolumn.addClass('hidden-md-down')
    taskscolumn.removeClass('hidden-md-down')
    bctopics.removeClass('active')
    topicentryactive.removeClass('topic-entry-active')
    $('#topic-a-' + topicid).addClass('topic-entry-active')
    bctopics.find('a').attr('href', '/account')
    bccurrenttopic.show()

    let request = $.ajax({
      url: '/ajax/topic/' + topicid + '/tasks',
      // url: "/",
      method: 'GET',
      dataType: 'json'
    })

    request.done(function (msg) {
      taskscolumn.html('<table class="table table-striped table-hover table-responsive table-tasklist">' +
        '<thead>' +
        '<tr>' +
        '<th>Numer</th>' +
        '<th>Tytuł Zadania</th>' +
        '<th class="text-center" data-toggle="tooltip" data-placement="top" ' +
            'title="Status przesłania odpowiedzi" data-original-title="Status przesłania odpowiedzi">fS</th>' +
        '<th class="text-center" data-toggle="tooltip" data-placement="top" ' +
            'title="Status nowych komentarzy" data-original-title="Status nowych komentarzy">fTC</th>' +
        '<th class="text-center" data-toggle="tooltip" data-placement="top" ' +
            'title="Status oceny prowadzącego" data-original-title="Status oceny prowadzącego">sT</th>' +
        '<th class="text-center" data-toggle="tooltip" data-placement="top" ' +
            'title="Status testu maszynowego" data-original-title="Status testu maszynowego">sM</th>' +
        '<th>Termin</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody id="tasks-tbody"></tbody>' +
        '</table>')

      for (let i = 0; i <= msg.length - 1; i++) {
        if (msg[i].hasReply === 0) {
          msg[i].hasReply = '-'
        } else if (msg[i].hasReply === 1) {
          msg[i].hasReply = '<i class="fa fa-check-circle fa-lg fa-fw text-success"></i>'
        }

        if (msg[i].hasComments === 0) {
          msg[i].hasComments = '-'
        } else if (msg[i].hasComments === 1) {
          msg[i].hasComments = '<i class="fa fa-exclamation-circle fa-lg fa-fw text-warning"></i>'
        }

        if (msg[i].teacherStatus === 0) {
          msg[i].teacherStatus = '-'
        } else if (msg[i].teacherStatus === 1) {
          msg[i].teacherStatus = '<i class="fa fa-check-circle fa-lg fa-fw text-success"></i>'
        } else if (msg[i].teacherStatus === 2) {
          msg[i].teacherStatus = '<i class="fa fa-times-circle fa-lg fa-fw text-danger"></i>'
        }

        if (msg[i].machineStatus === 0) {
          msg[i].machineStatus = '-'
        } else if (msg[i].machineStatus === 1) {
          msg[i].machineStatus = '<i class="fa fa-spinner fa-pulse sfa-lg fa-fw text-primary"></i>'
        } else if (msg[i].machineStatus === 2) {
          msg[i].machineStatus = '<i class="fa fa-check-circle fa-lg fa-fw text-success"></i>'
        } else if (msg[i].machineStatus === 3) {
          msg[i].machineStatus = '<i class="fa fa-times-circle fa-lg fa-fw text-danger"></i>'
        }

        $('#tasks-tbody').append('<tr class="taskentry" data-taskid="' + msg[i].id + '"><th><a href="/topic/' + topicid + '/task/' + msg[i].id + '">' + msg[i].number + '</a></th><td>' + msg[i].title + '</td><td>' + msg[i].hasReply + '</td><td>' + msg[i].hasComments + '</td><td>' + msg[i].teacherStatus + '</td><td>' + msg[i].machineStatus + '</td><td>' + msg[i].deadline + '</td></tr>')
      }
      $('[data-toggle="tooltip"]').tooltip()
      $('.taskentry').on('click', function () {
        window.location = '/topic/' + topicid + '/task/' + $(this).data('taskid')
      })
    })

    request.fail(function (jqXHR, textStatus) {
      console.log('Request failed: ' + textStatus)
    })

    history.replaceState(null, document.title, location.pathname + '#!/back')
    history.pushState(null, document.title, '/topic/' + topicid + '/tasks')

    window.addEventListener('popstate', function () {
      if (location.hash === '#!/back') {
        history.replaceState(null, document.title, location.pathname)
        setTimeout(function () {
          location.replace('/account')
        }, 0)
      }
    }, false)

    return false
  }

  if (typeof taskView !== 'undefined') {
    loadTaskView(taskView)
  }

  if (typeof currenttopic !== 'undefined') {
    currenttopiclink.attr('href', '/topic/' + currenttopic + '/tasks')
  }
})()
