/* eslint-disable no-unused-vars */
/**
 * TopicsAndTasksController
 *
 * @description :: Server-side logic for managing Topics & Tasks
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const dateFormat = require('dateformat')

const TopicsAndTasksController = module.exports = {
  listTopicsAndTasks: function (req, res) {
    Topics.find().populate('tasks').exec(function (err, topics) {
      if (err) {
        return res.serverError(err)
      }
      topics = _.forEach(topics, (t) => {
        t.deadline = dateFormat(t.deadline, 'dd/mm/yyyy')
      })
      return res.view('teacher/topicsAndTasks/list', {data: topics, menuItem: 'topics'})
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
        return res.view('teacher/topicsAndTasks/taskView', {task: task, description: description, menuItem: 'topics'})
      })
    })
  },

  addTopic: function (req, res) {
    let a = (msg) => Users.find({ isTeacher: true }).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }

      return res.view('teacher/topicsAndTasks/addTopic',
        {title: 'Add Topic :: Teacher Panel', users: users, message: msg, menuItem: 'topics'})
    })
    if (req.method === 'POST') {
      let number = req.param('topicNumber')
      let title = req.param('topicTitle')
      let deadline = req.param('topicDeadline')
      // if (!_.isString(title) || !_.isString(number) || !deadline) {
      //   return a('Uzupełnij wszystkie pola')
      // }
      Topics.create({
        number: number,
        title: title,
        visible: true,
        deadline: deadline
      }).exec(function (err, topic) {
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
    let a = (msg) => Users.find({ isTeacher: true }).exec((err, users) => {
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
          {title: 'Add Tasks :: Teacher Panel', users: users, message: msg, topics: topics, menuItem: 'topics'})
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
      if (!_.isString(title) || !_.isString(number) || !_.isString(description) ||
        !title) {
        return a('Uzupełnij wszystkie pola')
      }
      if (vis === 'ok') {
        vis = true
      } else {
        vis = false
      }
      if (ard === 'ok') {
        ard = true
      } else {
        ard = false
      }
      if (com === 'ok') {
        com = true
      } else {
        com = false
      }
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
    let a = (attr, msg) => Users.find({ isTeacher: true }).exec((err, users) => {
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
            return res.view('teacher/topicsAndTasks/editTask', {task: task, topics: topics, description: description, menuItem: 'topics'})
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
      if (vis === 'ok') {
        vis = true
      } else {
        vis = false
      }
      if (ard === 'ok') {
        ard = true
      } else {
        ard = false
      }
      if (com === 'ok') {
        com = true
      } else {
        com = false
      }
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
  }
}
