/* eslint-disable no-unused-vars,no-global-assign */

/* global topics, saved, location */

(function () {
  function ttSelectTopic (id) {
    const topic = topics.filter(topic => topic.id === id)[0]
    const tablebody = $('#tablebody')
    if (topic) {
      saved = tablebody.html()

      const tmplTableTT = $.templates('#tmplTableTT')

      const renderedTableTT = tmplTableTT.render({ topicNumber: topic.number, topicTitle: topic.title, topicId: topic.id, task: topic.tasks })

      tablebody.html(renderedTableTT)

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
