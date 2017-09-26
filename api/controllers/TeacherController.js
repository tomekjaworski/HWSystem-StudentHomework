/**
 * TeacherController
 *
 * @description :: Server-side logic for managing Teachers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const dateFormat = require('dateformat')
// eslint-disable-next-line no-unused-vars
const TeacherController = module.exports = {

  /**
   * `TeacherController.index()`
   */
  index: function (req, res) {
    LabGroups.find({owner:req.localUser.id}).exec((err,labs)=>{
      if(err) return res.serverError(err)
      if(labs.length===0){
        return res.view('teacher/index', {title: 'Dashboard :: Teacher Panel', menuItem: 'index'})
      }
      RecentTeacherActions.find({labgroup:labs.map(l=>l.id),seen:false}).sort('updatedAt DESC').exec((err,actions)=>{
        if(err) return res.serverError(err)
        _.forEach(actions, (a)=>{
          a.updatedAt = dateFormat(a.updatedAt, 'HH:MM dd/mm/yyyy')
        })
        return res.view('teacher/index', {title: 'Dashboard :: Teacher Panel', menuItem: 'index', actions:actions})
      })
    })
  },
  markAsRead: function (req, res) {
    let actions = req.param('actions')
    RecentTeacherActions.update(actions, {seen: true}).exec((err) => {
      if (err) return res.serverError(err)
      return res.redirect('/teacher')
    })
  },

  // Topic and Task

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
        if(err){
          return res.serverError(err)
        }
        return res.view('teacher/topicsAndTasks/taskView', {task: task, description:description})
      })
    })
  },

  addTopic: function (req, res) {
    let a = (msg) => Roles.findOne({name: 'teacher'}).populate('users').exec((err, role) => {
      if (err) {
        return res.serverError(err)
      }
      if (!role) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }

      return res.view('teacher/topicsAndTasks/addTopic',
        {title: 'Add Topic :: Teacher Panel', users: role.users, message: msg})
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
    let a = (msg) => Roles.findOne({name: 'teacher'}).populate('users').exec((err, role) => {
      if (err) {
        return res.serverError(err)
      }
      if (!role) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }
      Topics.find().exec(function (err, topics) {
        if (err) {
          return res.serverError(err)
        }
        return res.view('teacher/topicsAndTasks/add',
          {title: 'Add Tasks :: Teacher Panel', users: role.users, message: msg, topics: topics})
      })
    })
    if (req.method === 'POST') {
      let number = req.param('taskNumber')
      let title = req.param('taskTitle')
      let description = req.param('taskDescription')
      let topic = req.param('topicId')
      let vis = req.param('taskVisible')
      if (!_.isString(title) || !_.isString(number) || !_.isString(description) ||
        !title) {
        return a('Uzupełnij wszystkie pola')
      }
      if(vis === 'ok'){
        vis = true
      }else {
        vis = false
      }
      Tasks.create({
        number: number,
        title: title,
        visible: vis,
        topic: topic
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
    let a = (attr, msg) => Roles.findOne({name: 'teacher'}).populate('users').exec((err, role) => {
      if (err) {
        return res.serverError(err)
      }
      if (!role) {
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
          TaskDescription.findOne({task: task.id}).exec(function (err, description) {
            if(err){
              return res.serverError(err)
            }
            return res.view('teacher/topicsAndTasks/editTask', {task: task, topics:topics, description:description})
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
      if(vis === 'ok'){
        vis = true
      }else {
        vis = false
      }
      Tasks.update({id: id},
        {
          number: number,
          title: title,
          topic: topic,
          visible:vis
        }).exec(function (err, task) {
          if (err) {
            return res.serverError(err)
          }
          TaskDescription.update({task: task},
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
