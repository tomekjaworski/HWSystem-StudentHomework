/**
 * TeacherController
 *
 * @description :: Server-side logic for managing Teachers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const dateFormat = require('dateformat')
const pdc = require('pdc')

// eslint-disable-next-line no-unused-vars
const TeacherController = module.exports = {

  /**
   * `TeacherController.index()`
   */
  index: function (req, res) {
    return res.view('teacher/index', {title: 'Dashboard :: Teacher Panel', menuItem: 'index'})
  },

  // LabGroups

  listLabGroups: function (req, res) {
    let show = req.param('show')
    let cond = 'SELECT `labgroups`.`id`, `labgroups`.`active`, `labgroups`.`name`, COUNT(`sa`.`id`) `studentsCount`, COUNT(`sna`.`id`) `studentsNotCount`, `users`.`name`, `users`.`surname` FROM `labgroups` \n' +
      'LEFT JOIN `studentslabgroups` `sa` ON `sa`.`labgroup` = `labgroups`.`id` AND `sa`.`active`=1\n' +
      'LEFT JOIN `studentslabgroups` `sna` ON `sna`.`labgroup` = `labgroups`.`id` AND `sna`.`active`=0\n' +
      'LEFT JOIN `users` ON `users`.`id` = `labgroups`.`owner`'
    let params = {}
    if (show !== 'all') {
      cond += ' WHERE `labgroups`.`owner`=$1'
      params = [req.localUser.id]
    }
    cond += ' GROUP BY `labgroups`.`id`'
    sails.sendNativeQuery(cond, params).exec((err, groups) => {
      if (err) {
        return res.serverError(err)
      }
      return res.view('teacher/labgroups/list',
        {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', data: groups.rows, show: show})
    })
  },

  viewLabGroup: function (req, res) {
    let id = req.param('id')
    let a = (attr, msg) => LabGroups.findOne({id: id}).exec((err, lab) => {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return res.notFound()
      }
      StudentsLabGroups.find({labgroup: id, active: true}).populate('student').exec((err, students) => {
        if (err) {
          return res.serverError(err)
        }
        lab.students = students
        return res.view('teacher/labgroups/view',
          {
            title: 'LabGroups :: Teacher Panel',
            menuItem: 'labgroups',
            data: lab,
            message: {message: msg, attribute: attr}
          })
      })
    })

    if (req.method === 'POST') {
      let message = req.param('message')
      if (!!message && message !== '') {
        LabGroups.update({id: id}, {message: message}).exec((err) => {
          if (err) {
            return res.serverError(err)
          }
          a('info', 'Pomyślnie ustawiono wiadomość')
        })
      } else {
        a()
      }
    } else {
      let deactive = req.param('deactive')
      if (deactive) {
        StudentsLabGroups.update({student: deactive, labgroup: id, active: true}, {active: false}).meta({fetch: true})
          .exec((err, slg) => {
            if (err) {
              return res.serverError(err)
            }
            if (!slg || slg.length !== 1) {
              return a('danger', 'Błędny uzytkownik')
            }
            a('info', 'Pomyślnie deaktywowano użytkownika w grupie')
          })
      } else {
        a()
      }
    }
  },

  viewNewStudentsLabGroup: function (req, res) {
    let id = req.param('id')
    let a = (attr, msg) => LabGroups.findOne({id: id}).exec((err, lab) => {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return res.notFound()
      }
      StudentsLabGroups.find({labgroup: id, active: false}).populate('student').exec((err, students) => {
        if (err) {
          return res.serverError(err)
        }
        lab.students = students
        return res.view('teacher/labgroups/viewNewStudents',
          {
            title: 'LabGroups :: Teacher Panel',
            menuItem: 'labgroups',
            data: lab,
            message: {message: msg, attribute: attr}
          })
      })
    })
    let active = req.param('active')
    if (active) {
      StudentsLabGroups.update({student: active, labgroup: id, active: false}, {active: true}).meta({fetch: true})
        .exec((err, slg) => {
          if (err) {
            return res.serverError(err)
          }
          if (!slg || slg.length !== 1) {
            return a('danger', 'Błędny uzytkownik')
          }
          a('info', 'Pomyślnie aktywowano użytkownika w grupie')
        })
    } else {
      a()
    }
  },

  addLabGroup: function (req, res) {
    let a = (msg) => Roles.findOne({name: 'teacher'}).populate('users').exec((err, role) => {
      if (err) {
        return res.serverError(err)
      }
      if (!role) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }
      return res.view('teacher/labgroups/add',
        {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', users: role.users, message: msg})
    })
    if (req.method === 'POST') {
      let title = req.param('title')
      let desc = req.param('desc')
      let active = req.param('active')
      let owner = req.param('owner')
      if (!_.isString(title) || !_.isString(desc) || !_.isString(owner) ||
        !title || !desc || !owner) {
        return a('Uzupełnij wszystkie pola')
      }
      LabGroups.create({
        name: title,
        description: desc,
        subject: 1,
        active: !!active,
        owner: owner
      }).meta({fetch: true}).exec((err, lab) => {
        if (err) {
          return res.serverError(err)
        }
        if (!lab) {
          return res.serverError('Nie udało sie uwtorzyć grupy')
        }
        return res.redirect('/teacher/labgroup/view/' + lab.id)
      })
    } else {
      a()
    }
  },

  editLabGroup: function (req, res) {
    let id = req.param('id')
    let a = (attr, msg) => Roles.findOne({name: 'teacher'}).populate('users').exec((err, role) => {
      if (err) {
        return res.serverError(err)
      }
      if (!role) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }
      LabGroups.findOne({id: id}).exec((err, lab) => {
        if (err) {
          return res.serverError(err)
        }
        if (!lab) {
          return res.notFound()
        }
        return res.view('teacher/labgroups/edit',
          {
            title: 'LabGroups :: Teacher Panel',
            menuItem: 'labgroups',
            data: lab,
            users: role.users,
            message: {message: msg, attribute: attr}
          })
      })
    })
    if (req.method === 'POST') {
      let title = req.param('title')
      let desc = req.param('desc')
      let active = req.param('active')
      let owner = req.param('owner')
      if (!_.isString(title) || !_.isString(desc) || !_.isString(owner) ||
        !title || !desc || !owner) {
        return a('danger', 'Uzupełnij wszystkie pola')
      }
      LabGroups.update({id: id}, {
        name: title,
        description: desc,
        active: !!active,
        owner: owner
      }).exec((err, lab) => {
        if (err) {
          return res.serverError(err)
        }
        return a('info', 'Pomyślnie edytowano grupę')
      })
    } else {
      a()
    }
  },

  // Topic & Tasks

  // Task Replies

  selectTaskReplies: function (req, res) {
    Topics.find().populate('tasks').exec((err, topics) => {
      if (err) {
        return res.serverError(err)
      }
      return res.view('teacher/replies/index',
        {title: 'Task Replies :: Teacher Panel', menuItem: 'replies', data: topics})
    })
  },

  viewTaskReplies: function (req, res) {
    let id = req.param('taskid')
    Tasks.findOne(id).populate('topic').exec((err, task) => {
      if (err) {
        return res.serverError(err)
      }
      if (!task) {
        return res.notFound()
      }
      LabGroups.find({select: ['name', 'id', 'owner']}).populate('owner').exec((err, labs) => {
        if (err) {
          return res.serverError(err)
        }
        if (!labs) {
          return res.serverError('Nie zdefiniowano żadnych grup laboratoryjnych')
        }
        task.labs = labs
        return res.view('teacher/replies/view',
          {title: 'Task Replies :: Teacher Panel', menuItem: 'replies', data: task})
      })
    })
  },

  viewTaskOfLab: function (req, res) {
    let taskId = req.param('taskId')
    let labId = _.toInteger(req.param('labId'))
    Tasks.findOne(taskId).exec((err, task) => {
      if (err) {
        return res.serverError(err)
      }
      if (!task) {
        return res.notFound()
      }
      LabGroups.findOne(labId).exec((err, labgrp) => {
        if (err) {
          return res.serverError(err)
        }
        if (!labgrp) {
          return res.notFound()
        }
        StudentsLabGroups.find({labgroup: labId, active: true}).populate('student').exec((err, lab) => {
          if (err) {
            return res.serverError(err)
          }
          if (!lab || !lab.length || lab.length === 0) {
            return res.view('teacher/replies/labTasksPartial',
              {
                lab: labgrp,
                data: null
              })
          }
          let students = lab.map(e => e.student)
          let studentsId = lab.map(e => e.student.id)
          sails.sendNativeQuery(`SELECT slb.student,
(case when scdl.task IS NOT NULL then scdl.deadline else
 (case when lbtd.deadline IS NOT NULL then lbtd.deadline else topic.deadline end) end) deadline
FROM studentslabgroups slb
LEFT JOIN tasks task ON task.id = $1
LEFT JOIN topics topic ON task.topic = topic.id
LEFT JOIN labgrouptopicdeadline lbtd ON lbtd.group = slb.labgroup AND lbtd.topic = task.topic
LEFT JOIN studentcustomdeadlines scdl ON scdl.student = slb.student AND scdl.task = task.id
WHERE slb.labgroup =$2 AND slb.active=1`, [taskId, labId]).exec((err, result) => {
  if (err) {
    return res.serverError(err)
  }
  let deadlines = result.rows
  students = _.forEach(students, (s) => {
    s.deadline = dateFormat(deadlines.find(d => d.student === s.id).deadline, 'dd/mm/yyyy')
  })
  TaskComments.find({task: taskId, taskStudent: studentsId}).populate('user').exec((err, comments) => {
    if (err) {
      return res.serverError(err)
    }
    if (comments && comments.length && comments.length > 0) {
      for (let s of students) {
        s.comments = comments.filter(c => c.taskStudent === s.id)
      }
    }
    TaskReplies.find({task: taskId, student: studentsId}).populate('files').exec((err, replies) => {
      if (err) {
        return res.serverError(err)
      }

      if (!replies || !replies.length || replies.length === 0) {
        return res.view('teacher/replies/labTasksPartial',
          {
            lab: labgrp,
            data: students
          })
      } else {
        MySqlFile().readManyByReply(replies.map(e => e.id), (err, files) => {
          if (err) {
            return res.serverError(err)
          }

          let promises = files.map(function (file) {
            return new Promise(function (resolve, reject) {
              if (file.fileMimeType.includes('text/')) {
                let type = ''
                if (['h', 'c'].includes(file.fileExt)) {
                  type = 'c'
                } else if (['hpp', 'cpp'].includes(file.fileExt)) {
                  type = 'c++'
                } else {
                  return resolve(file)
                }
                content = '```' + type + '\n' + file.file + '\n```'
                pdc(content, 'markdown_github', 'html5', function (err, result) {
                  if (err) {
                    return reject(err)
                  }
                  file.file = result
                  return resolve(file)
                })
              } else {
                return resolve(file)
              }
            })
          })

          Promise.all(promises).then((files) => {
            for (let s of students) {
              s.reply = replies.find(r => r.student === s.id)
              if (s.reply) {
                s.reply.files = files.filter(file => {
                  if (file.reply === s.reply.id) {
                    return true
                  }
                  return false
                })
              }
            }
            return res.view('teacher/replies/labTasksPartial',
              {
                lab: labgrp,
                data: students
              })
          })
        })
      }
    })
  })
})
        })
      })
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
