/* eslint-disable no-unused-vars,no-global-assign */

/* global topics, saved, location */

(function () {
  function ttSelectTopic (id) {
    const topic = topics.filter(topic => topic.id === id)[0]
    const tablebody = $('#tablebody')
    if (topic) {
      saved = tablebody.html()
      /* let ret =
        '<tr>' +
        '<td>' +
        '<i style="cursor: pointer;" class="fa fa-arrow-left fa-lg ttGetBackButton" aria-hidden="true"></i>' +
        '</td>' +
        '<td>' + topic.number + '. ' + topic.title + '</td>' +
        '<td></td><td></td>' +
        '<td class="text-nowrap">' + topic.deadline + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="5">' +
        '<table class="table table-bordered table-striped table-hover responsive">' +
        '<tbody id="tablebody">' +
        '<a class="btn btn-primary mb-3" href="/teacher/topics-and-tasks/topic/' + topic.id + '/task/add">Dodaj zadanie</a>'
      for (let taskn in topic.tasks) {
        const task = topic.tasks[taskn]
        ret +=
          '<tr style="cursor: pointer;">' +
          '<td>' + task.id + '</td>' +
          '<td onclick="document.location=\'/teacher/topics-and-tasks/view/' + task.id + '\'">' + task.number + '. ' + task.title + '</td>' +
          '<td class="text-center align-middle"><a class="btn btn-sm btn-primary" href="/teacher/topics-and-tasks/task/edit/' + task.id + '">Edytuj</a></td>' +
          '<td class="text-center align-middle"><i class="fa fa-microchip ' + (task.arduino ? 'text-success' : 'text-danger') + '"></i></td>' +
          '<td class="text-center align-middle"><i class="fa fa-desktop ' + (task.computer ? 'text-success' : 'text-danger') + '"></i></td>' +
          '<td class="text-center">' +
            '<a class="btn btn-sm btn-link taskUpButton" data-id="' + task.id + '" data-place="' + task.place + '" data-topic="' + task.topic + '">' +
              '<i class="fa fa-lg fa-arrow-up"></i>' +
            '</a>' +
            '<a class="btn btn-sm btn-link taskDownButton" data-id="' + task.id + '" data-place="' + task.place + '" data-topic="' + task.topic + '">' +
              '<i class="fa fa-lg fa-arrow-down"></i>' +
            '</a>' +
          '</td>' +
          '</tr>'
      }
      ret +=
        '</tbody>' +
        '</table>' +
        '</td>' +
        '</tr>' */
      const tmplTableTT = $.templates('#tmplTableTT')

      const renderedTableTT = tmplTableTT.render({ topicNumber: topic.number, topicTitle: topic.title, topicId: topic.id, task })

      $('#tablebody').html(renderedTableTT)

      $('.ttGetBackButton').on('click', function () {
        ttGetBack()
      })
      $('.taskUpButton').on('click', function () {
        const taskId = $(this).data('id')
        const taskPlace = $(this).data('place')
        const taskTopic = $(this).data('topic')
        taskUp(taskId, taskPlace, taskTopic)

        return false
      })
      $('.taskDownButton').on('click', function () {
        const taskId = $(this).data('id')
        const taskPlace = $(this).data('place')
        const taskTopic = $(this).data('topic')
        taskDown(taskId, taskPlace, taskTopic)

        return false
      })
    }
  }

  function ttGetBack () {
    if (saved === '') {
      return
    }
    $('#tablebody').html(saved)
    initTable()
  }

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
    let b4Place = parseInt(place)
    b4Place = b4Place - 1
    const b4 = $('#' + topic + b4Place)
    const a = $('#' + topic + place)
    // var spanb4 = $('#s' + topic + b4Place)
    // var spana = $('#s' + topic + place)
    console.log(b4)
    console.log(a)
    response.done(function () {
      location.reload()
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
      location.reload()
      console.log('ok')
    })
  }

  function delTopic (id) {
    console.log('start')
    let response = $.ajax({
      url: '/ajax/topic/deleted',
      method: 'POST',
      data: {
        topicId: id
      }
    })

    response.done(function () {
      console.log('done')
      window.location.reload()
    })
  }
  function delTask (id) {
    console.log('start')
    let response = $.ajax({
      url: '/ajax/task/deleted',
      method: 'POST',
      data: {
        taskId: id
      }
    })

    response.done(function () {
      console.log('done')
      // todo: zeby zaladowalo tego taska w ktorym byl
      window.location = '/teacher/topics-and-tasks/'
    })
  }

  function initTable () {
    $('.ttSelectTopic').on('click', function () {
      ttSelectTopic($(this).data('topicid'))
    })

    $('.deleteTopicButton').on('click', function () {
      const deleteId = $(this).data('id')
      delTopic(deleteId)
      return false
    })

    $('.deleteTaskButton').on('click', function () {
      const deleteId = $(this).data('id')
      delTask(deleteId)
      return false
    })

    $('.editTopicButton').on('click', function () {
      window.location = '/teacher/topics-and-tasks/topic/edit/' + $(this).data('id')
      return false
    })
  }

  initTable()
})()
