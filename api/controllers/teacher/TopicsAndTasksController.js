/* eslint-disable no-unused-vars */
// todo: przy errorze jak sie dodaje, zostawic wartosci
/**
 * TopicsAndTasksController
 *
 * @description :: Server-side logic for managing Topics & Tasks
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const pdc = require('pdc')
const dateFormat = require('dateformat')

const TopicsAndTasksController = module.exports = {
  listTopicsAndTasks (req, res) {
    Topics.find().populate('tasks', {sort: 'place ASC'}).exec(function (err, topics) {
      if (err) {
        return res.serverError(err)
      }
      topics = _.forEach(topics, (t) => {
        try {
          t.deadline = dateFormat(t.deadline, 'dd/mm/yyyy')
        } catch (err) {
          return res.serverError(err)
        }
      })
      return res.view('teacher/topicsAndTasks/list', {
        data: topics,
        menuItem: 'topics',
        breadcrumb: 'list'
      })
    })
  },

  taskView (req, res) {
    let id = req.param('id')
    Tasks.findOne(id).populate('topic').exec(function (err, task) {
      if (err) {
        return res.serverError(err)
      }
      if (!task) {
        return res.notFound()
      }

      TaskDescription.findOne({task: task.id}).exec(function (err, description) {
        if (err) {
          return res.serverError(err)
        }
        pdc(description.description, 'markdown_github-raw_html', 'html5', function (err, result) {
          if (err) {
            return res.serverError(err)
          }
          return res.view('teacher/topicsAndTasks/taskView', {
            task: task,
            description: result,
            menuItem: 'topics',
            breadcrumb: 'view'
          })
        })
      })
    })
  },

  addTopic (req, res) {
    let a = (msg, param) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError(req.i18n.__('teacher.labs.noteachers'))
      }

      return res.view('teacher/topicsAndTasks/addTopic',
        {
          title: req.i18n.__('teacher.tt.addtopic.title'),
          users: users,
          message: msg,
          param: param,
          menuItem: 'topics',
          breadcrumb: 'addtopic'
        })
    })
    if (req.method === 'POST') {
      const number = req.param('topicNumber')
      const title = req.param('topicTitle')
      const deadline = req.param('topicDeadline')
      if (!title || !number || !deadline) {
        return a(req.i18n.__('teacher.tt.fillall'), req.param)
      }
      const date = Date.parse(deadline)
      if (isNaN(date)) {
        return a(req.i18n.__('teacher.tt.invaliddate'), req.param)
      }
      Topics.create({
        number: number,
        title: title,
        visible: true,
        deadline: date
      }).meta({fetch: true}).exec(function (err, topic) {
        if (err) {
          return res.serverError(err)
        }
        if (!topic) {
          return res.serverError(req.i18n.__('teacher.tt.addtopic.fail'), req.param)
        }
        return res.redirect('/teacher/topics-and-tasks/')
      })
    } else {
      a()
    }
  },

  addTask (req, res) {
    let a = (msg, param) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError(req.i18n.__('teacher.labs.noteachers'))
      }
      Topics.find().exec(function (err, topics) {
        if (err) {
          return res.serverError(err)
        }
        return res.view('teacher/topicsAndTasks/add',
          {
            title: req.i18n.__('breadcrumbs.tt.addtask'),
            users: users,
            message: msg,
            param: param,
            topics: topics,
            menuItem: 'topics',
            breadcrumb: 'addtask'
          })
      })
    })
    if (req.method === 'POST') {
      let number = req.param('taskNumber')
      let title = req.param('taskTitle')
      let description = req.param('taskDescription')
      let topic = req.param('topicId')
      let vis = req.param('taskVisible')
      let ard = req.param('arduinoCheck')
      let com = req.param('komputerCheck')
      if (!title || !number || !description) {
        return a(req.i18n.__('teacher.labs.fillall'), req.param)
      }
      vis = vis === 'ok'
      ard = ard === 'ok'
      com = com === 'ok'
      Topics.findOne({id: topic}).populate('tasks').exec(function (err, topics) {
        if (err) {
          return res.serverError(err)
        }
        let place
        let allPlace = []
        for (let i = 0; i < topics.tasks.length; i++) {
          allPlace.push(topics.tasks[i].place)
        }
        if (allPlace.length === 0) {
          place = 1
        } else {
          let max = Math.max(...allPlace)
          place = max + 1
        }

        Tasks.create({
          number: number,
          title: title,
          visible: vis,
          topic: topic,
          arduino: ard,
          computer: com,
          place: place
        }).meta({fetch: true}).exec((err, task) => {
          if (err) {
            return res.serverError(err)
          }
          if (!task) {
            return res.serverError(req.i18n.__('teacher.tt.addtask.fail'))
          }
          TaskDescription.create({
            task: task.id,
            description: description
          }).exec(function (err) {
            if (err) {
              return res.serverError(err)
            }
            return res.redirect('/teacher/topics-and-tasks/view/' + task.id)
          })
        })
      })
    } else {
      a()
    }
  },

  editTask (req, res) {
    let id = req.param('id')
    let a = (attr, msg, param) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError('teacher.labs.noteachers')
      }
      Tasks.findOne({id: id}).populate('description').exec(function (err, task) {
        if (err) {
          return res.serverError(err)
        }
        if (!task) {
          return res.notFound()
        }
        Topics.find().exec(function (err, topics) {
          if (err) {
            return res.serverError(err)
          }
          TaskDescription.findOne({task: task.id}).exec(function (err, description) {
            if (err) {
              return res.serverError(err)
            }
            return res.view('teacher/topicsAndTasks/editTask', {
              task: task,
              topics: topics,
              param: param,
              description: description,
              message: {message: msg, attribute: attr},
              menuItem: 'topics',
              breadcrumb: 'edittask'
            })
          })
        })
      })
    })
    if (req.method === 'POST') {
      let title = req.param('taskTitle')
      let number = req.param('taskNumber')
      let description = req.param('taskDescription')
      let topic = req.param('taskTopic')
      if (!title || !number || !description || !topic) {
        return a('danger', req.i18n.__('teacher.labs.fillall'), req.param)
      }
      let vis = req.param('taskVisible')
      let ard = req.param('arduinoCheck')
      let com = req.param('komputerCheck')
      vis = vis === 'ok'
      ard = ard === 'ok'
      com = com === 'ok'
      Tasks.update({id: id},
        {
          number: number,
          title: title,
          topic: topic,
          visible: vis,
          arduino: ard,
          computer: com
        }).exec(function (err) {
          if (err) {
            return res.serverError(err)
          }
          TaskDescription.update({task: id},
            {
              description: description
            }).exec(function (err, desc) {
              if (err) {
                return res.serverError(err)
              }
              return a('success', req.i18n.__('teacher.tt.edittask.success'))
            })
        })
    } else {
      a()
    }
  },
  ajaxPlace (req, res) {
    // todo: usunąć console logi i wogole co to za 'ops coś się zepsuło'
    if (req.method === 'POST') {
      let topic = req.param('topic')
      let value = req.param('value')
      let idUp = req.param('idUp')
      let place = req.param('place')
      let placeNx = req.param('nextPlace')
      place = parseInt(place)
      placeNx = parseInt(placeNx)
      console.log(placeNx)
      console.log(place)
      if (value === 'up') {
        if (place !== 1) {
          Tasks.update({id: idUp}, {place: place - 1}).meta({fetch: true}).exec(function (err, task) {
            if (err) {
              return res.serverError(err)
            }
            Tasks.update({
              topic: topic,
              place: place - 1,
              id: {'!=': idUp}
            }, {place: placeNx}).meta({fetch: true}).exec(function (err, task) {
              if (err) {
                return res.serverError(err)
              }
              return res.json('Task Up')
            })
          })
        } else if (place === 1) {
          console.log('Place === 1')
        }
      } else if (value === 'down') {
        Topics.findOne({id: topic}).populate('tasks').exec(function (err, topics) {
          if (err) {
            return res.serverError(err)
          }
          let allPlace = []
          for (let i = 0; i < topics.tasks.length; i++) {
            allPlace.push(topics.tasks[i].place)
          }
          let max = Math.max(...allPlace)
          if (place !== max) {
            Tasks.update({id: idUp}, {place: place + 1}).meta({fetch: true}).exec(function (err, task) {
              if (err) {
                return res.serverError(err)
              }
              Tasks.update({
                topic: topic,
                place: place + 1,
                id: {'!=': idUp}
              }, {place: placeNx}).meta({fetch: true}).exec(function (err) {
                if (err) {
                  return res.serverError(err)
                }
                return res.json('Task Down')
              })
            })
          } else if (place === max) {
            console.log('place === max')
          }
        })
      } else {
        return res.serverError('ops coś się zepsuło')
      }
    }
  },

  taskDelete (req, res) {
    let id = req.param('taskId')
    Tasks.destroy({id: id}).exec(function (err) {
      if (err) {
        return res.serverError(err)
      }
      return res.ok('ok')
    })
  },

  topicDelete (req, res) {
    let id = req.param('topicId')
    Topics.findOne({id: id}).populate('tasks').exec(function (err, topic) {
      if (err) {
        return res.serverError(err)
      }
      let tasksCount = topic.tasks
      if (tasksCount.length !== 0) {
        return res.json('hasTasks')
      } else {
        Topics.destroy({id: topic.id}).exec(function (err) {
          if (err) {
            return res.serverError(err)
          }
          return res.json('done')
        })
      }
    })
  },

  editTopic (req, res) {
    let id = req.param('id')
    let a = (attr, msg) => {
      return Users.find({isTeacher: true}).exec((err, users) => {
        if (err) {
          return res.serverError(err)
        }
        if (!users || users.length === 0) {
          return res.serverError(req.i18n.__('teacher.labs.noteachers'))
        }
        Topics.findOne({id: id}).exec(function (err, topic) {
          if (err) {
            return res.serverError(err)
          }
          if (!topic) {
            return res.notFound()
          }

          topic.deadline = dateFormat(topic.deadline, 'yyyy-mm-dd')

          return res.view('teacher/topicsAndTasks/editTopic', {
            topic: topic,
            menuItem: 'topics',
            message: msg,
            breadcrumb: 'edittopic'
          })
        })
      })
    }
    if (req.method === 'POST') {
      let number = req.param('topicNumber')
      let title = req.param('topicTitle')
      let visible = req.param('topicVisible')
      let deadline = req.param('topicDeadline')
      visible = !!(visible)
      if (!number || !title || !deadline) {
        a('danger', req.i18n.__('teacher.labs.fillall'))
      } else {
        deadline = Date.parse(deadline)
        if (isNaN(deadline)) {
          return res.badRequest()
        }
        Topics.update({id: id},
          {
            number: number,
            title: title,
            visible: visible,
            deadline: deadline
          }).exec(function (err) {
            if (err) {
              return res.serverError(err)
            }
            return res.redirect('/teacher/topics-and-tasks')
          })
      }
    } else {
      a()
    }
  }

}
