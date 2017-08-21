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

    topicscolumn.addClass('hidden-md-down')
    taskscolumn.removeClass('hidden-md-down')
    bctopics.removeClass('active')
    bctopics.find('a').attr('href', '/account')
    bccurrenttopic.show()

    let request = $.ajax({
      url: '/ajax/topic/' + topicid + '/tasks',
      // url: "/",
      method: 'GET',
      dataType: 'json'
    })

    request.done(function (msg) {
      taskscolumn.html('<table class="table table-striped table-hover table-responsive table-tasklist"><thead><tr><th>Numer</th><th>Tytuł Zadania</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Termin</th></tr></thead><tbody id="tasks-tbody"></tbody></table>')

      for (let i = 0; i <= msg.length - 1; i++) {
        $('#tasks-tbody').append('<tr><th><a href="/topic/' + topicid + '/task/' + msg[i].id + '">' + msg[i].number + '</a></th><td>' + msg[i].title + '</td><td>' + msg[i].hasReply + '</td><td>' + msg[i].hasComments + '</td><td>' + msg[i].teacherStatus + '</td><td>' + msg[i].machineStatus + '</td><td>' + msg[i].deadline + '</td></tr>')
      }
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
