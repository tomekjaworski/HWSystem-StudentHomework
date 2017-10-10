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
  listTopicsAndTasks: function (req, res) {
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

  taskView: function (req, res) {
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
        pdc(description.description, 'markdown_github', 'html5', function (err, result) {
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

  addTopic: function (req, res) {
    let a = (msg) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }

      return res.view('teacher/topicsAndTasks/addTopic',
        {
          title: 'Add Topic :: Teacher Panel',
          users: users,
          message: msg,
          menuItem: 'topics',
          breadcrumb: 'addtopic'
        })
    })
    if (req.method === 'POST') {
      const number = req.param('topicNumber')
      const title = req.param('topicTitle')
      const deadline = req.param('topicDeadline')
      const date = Date.parse(deadline)
      // if (!_.isString(title) || !_.isString(number) || !deadline) {
      //   return a('Uzupełnij wszystkie pola')
      // }
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
          return res.serverError('Nie udało się utworzyć tematu')
        }
        return res.redirect('/teacher/topics-and-tasks/')
      })
    } else {
      a()
    }
  },

  addTask: function (req, res) {
    let a = (msg) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }
      Topics.find().exec(function (err, topics) {
        if (err) {
          return res.serverError(err)
        }
        return res.view('teacher/topicsAndTasks/add',
          {
            title: 'Add Tasks :: Teacher Panel',
            users: users,
            message: msg,
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
      if (!_.isString(title) || !_.isString(number) || !_.isString(description) || !title) {
        return a('Uzupełnij wszystkie pola')
      }
      vis = vis === 'ok'
      ard = ard === 'ok'
      com = com === 'ok'
      Tasks.create({
        number: number,
        title: title,
        visible: vis,
        topic: topic,
        arduino: ard,
        computer: com
      }).meta({fetch: true}).exec((err, task) => {
        if (err) {
          return res.serverError(err)
        }
        if (!task) {
          return res.serverError('Nie udało sie uwtorzyć zadania')
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
    } else {
      a()
    }
  },

  editTask: function (req, res) {
    let id = req.param('id')
    let a = (attr, msg) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
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
              description: description,
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
              return a('Udało się zaktualizować zadanie')
            })
        })
    } else {
      a()
    }
  },
  ajaxPlace: function (req, res) {
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
        Tasks.update({id: idUp}, {place: place + 1}).meta({fetch: true}).exec(function (err, task) {
          if (err) {
            return res.serverError(err)
          }
          Tasks.update({topic: topic, place: place + 1, id: {'!=': idUp}}, {place: placeNx}).meta({fetch: true}).exec(function (err) {
            if (err) {
              return res.serverError(err)
            }
            return res.json('Task Down')
          })
        })
      } else {
        return res.serverError('ops coś się zepsuło')
      }
    }
  },

  taskDelete: function (req, res) {
    let id = req.param('taskId')
    Tasks.destroy({id: id}).exec(function (err) {
      if (err) {
        res.serverError(err)
      }
      return res.ok('ok')
    })
  },

  topicDelete: function (req, res) {
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

  editTopic: function (req, res) {
    let id = req.param('id')
    let a = (attr, msg) => {
      return Users.find({isTeacher: true}).exec((err, users) => {
        if (err) {
          return res.serverError(err)
        }
        if (!users || users.length === 0) {
          return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
        }
        Topics.findOne({id: id}).exec(function (err, topic) {
          if (err) {
            return res.serverError(err)
          }
          if (!topic) {
            return res.notFound()
          }

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
        a('danger', 'Uzupełnij wszystkie pola')
      } else {
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
