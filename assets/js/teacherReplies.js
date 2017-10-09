/* eslint-disable no-unused-vars,no-global-assign */

/* global topics, saved */
'use strict'

function repliesSelectTopic (id) {
  const topic = topics.filter(topic => topic.id === id)[0]
  if (topic) {
    saved = document.getElementById('tablebody').innerHTML
    let ret = '<tr><th><i onclick="repliesGetBack()" style="cursor: pointer;" class="fa fa-arrow-left fa-lg" aria-hidden="true"></i></th><td>' + topic.number + '. ' + topic.title + '</td></tr><tr><td colspan="2"><table class="table table-bordered table-striped table-hover responsive"><tbody id="tablebody">'
    for (let taskn in topic.tasks) {
      const task = topic.tasks[taskn]
      ret += '<tr style="cursor: pointer;" onclick="document.location=\'/teacher/replies/view/' + task.id + '\'"><td>' + task.id + '</td><td>' + task.number + '. ' + task.title + '</td></tr>'
    }
    ret += '</tbody></table></td></tr>'
    document.getElementById('tablebody').innerHTML = ret
  }
}

function repliesGetBack () {
  if (saved === '') {
    return
  }
  document.getElementById('tablebody').innerHTML = saved
}
