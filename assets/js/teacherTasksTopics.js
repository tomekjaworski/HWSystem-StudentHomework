/* eslint-disable no-unused-vars,no-global-assign */

/* global topics, saved */
'use strict'

function ttSelectTopic (id) {
  const topic = topics.filter(topic => topic.id === id)[0]
  if (topic) {
    saved = document.getElementById('tablebody').innerHTML
    let ret =
      '<tr>' +
      '<th>' +
        '<i onclick="ttGetBack()" style="cursor: pointer;" class="fa fa-arrow-left fa-lg" aria-hidden="true"></i>' +
      '</th>' +
        '<td>' + topic.number + '. ' + topic.title + '</td>' +
        '<td></td>' +
      '</tr>' +
      '<tr>' +
        '<td colspan="3">' +
          '<table class="table table-bordered table-striped table-hover responsive">' +
            '<tbody id="tablebody">' +
              '<a class="btn btn-primary mb-3" href="/teacher/topics-and-tasks/topic/' + topic.id + '/task/add">Dodaj zadanie</a>'
    for (let taskn in topic.tasks) {
      const task = topic.tasks[taskn]
      ret +=
              '<tr style="cursor: pointer;" onclick="document.location=\'/teacher/topics-and-tasks/view/' + task.id + '\'">' +
                '<td>' + task.id + '</td>' +
                '<td>' + task.number + '. ' + task.title + '</td>' +
                '<td class="text-center align-middle"><a class="btn btn-sm btn-primary" href="/teacher/topics-and-tasks/task/edit/' + task.id + '">Edytuj</a></td>' +
                '<td class="text-center align-middle"><i class="fa fa-microchip ' + (task.arduino ? 'text-success' : 'text-danger') + '"></i></td>' +
                '<td class="text-center align-middle"><i class="fa fa-desktop ' + (task.computer ? 'text-success' : 'text-danger') + '"></i></td>' +
                '<td class="text-center"><a class="btn btn-sm btn-link" href="#"><i class="fa fa-lg fa-arrow-up"></i></a> <a class="btn btn-sm btn-link" href="#"><i class="fa fa-lg fa-arrow-down"></i></a></td>' +
              '</tr>'
    }
    ret +=
            '</tbody>' +
          '</table>' +
        '</td>' +
      '</tr>'
    document.getElementById('tablebody').innerHTML = ret
  }
}

function ttGetBack () {
  if (saved === '') {
    return
  }
  document.getElementById('tablebody').innerHTML = saved
}
