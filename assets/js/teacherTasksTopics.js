/* eslint-disable no-unused-vars,no-global-assign */

/* global topics, saved, location */

(function () {
  function ttSelectTopic (id) {
    if (!topics) {
      return
    }
    const topic = topics.filter(topic => topic.id === id)[0]
    const tablebody = $('#ttTableBody')
    if (topic) {
      saved = tablebody.html()

      const tmplTableTT = $.templates('#tmplTableTT')

      const renderedTableTT = tmplTableTT.render({
        topicNumber: topic.number,
        topicTitle: topic.title,
        topicDeadline: topic.deadline,
        topicId: topic.id,
        task: topic.tasks
      })

      tablebody.html(renderedTableTT)

      $('.ttGetBackButton').on('click', function () {
        ttGetBack()
      })
    }
  }

  function ttGetBack () {
    if (saved === '') {
      return
    }
    $('#ttTableBody').html(saved)
    initTable()
  }

  function delTopicModal (id) {
    let removeTTModal = $('.removeTTModal')

    if (removeTTModal.length > 0) {
      return false
    }

    const tmplRemoveTTModal = $.templates('#tmplRemoveTTModal')

    const renderedRemoveTTModal = tmplRemoveTTModal.render({id: id})

    $('#modalContainer').html(renderedRemoveTTModal)

    removeTTModal = $('#removeTTModal')
    removeTTModal.modal()

    removeTTModal.on('hidden.bs.modal', function () {
      $(this).remove()
    })

    $('.deleteTopicButton').on('click', function () {
      const deleteId = $(this).data('id')
      delTopic(deleteId)
      removeTTModal.modal('hide')
      return false
    })
  }
  function delTopic (id) {
    console.log('start')
    $.ajax({
      url: '/ajax/topic/deleted',
      method: 'POST',
      data: {
        topicId: id
      },
      success: function () {
        window.location = '/teacher/topics-and-tasks/'
      },
      error: function () {
        let removeTTModalFail = $('.removeTTModal')

        if (removeTTModalFail.length > 0) {
          return false
        }

        const tmplRemoveTTModalFail = $.templates('#tmplRemoveTTModal')

        const renderedRemoveTTModalFail = tmplRemoveTTModalFail.render({id: id, error: true})

        $('.modal-backdrop').remove()
        $('#modalContainer').html(renderedRemoveTTModalFail)

        removeTTModalFail = $('#removeTTModal')
        removeTTModalFail.modal()

        removeTTModalFail.on('hidden.bs.modal', function () {
          $(this).remove()
        })
      }
    })
  }
  function delTaskModal (id) {
    let removeTTModal = $('.removeTTModal')

    if (removeTTModal.length > 0) {
      return false
    }

    const tmplRemoveTTModal = $.templates('#tmplRemoveTTModal')

    const renderedRemoveTTModal = tmplRemoveTTModal.render({id: id})

    $('#modalContainer').html(renderedRemoveTTModal)

    removeTTModal = $('#removeTTModal')
    removeTTModal.modal()

    removeTTModal.on('hidden.bs.modal', function () {
      $(this).remove()
    })

    $('.deleteTaskButton').on('click', function () {
      const deleteId = $(this).data('id')
      delTask(deleteId)
      removeTTModal.modal('hide')
      return false
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

    $('.deleteTopicModalButton').on('click', function () {
      const deleteId = $(this).data('id')
      delTopicModal(deleteId)
      return false
    })

    $('.deleteTaskModalButton').on('click', function () {
      const deleteId = $(this).data('id')
      delTaskModal(deleteId)
      return false
    })

    $('.editTopicButton').on('click', function () {
      window.location = '/teacher/topics-and-tasks/topic/edit/' + $(this).data('id')
      return false
    })
  }

  let params = {}
  location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) { params[k] = v })
  if (params['topic']) {
    ttSelectTopic(parseInt(params['topic']))
  }

  initTable()
})()
