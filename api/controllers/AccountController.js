/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const crypto = require('crypto')
const pdc = require('pdc')

const AccountController = module.exports = {

  // Static functions

  /**
   * @description :: Render login page with error
   * @param res   :: Response object
   * @param err   :: Error message
   */
  loginError: function (res, err) {
    return res.view('account/login', {title: 'Logowanie', error: err})
  },

  /**
   * @description     :: Hash password with given salt
   * @param password  :: Password to hash
   * @param salt      :: Salt to hash password
   * @returns {*}     :: Hashed password
   */
  hashPassword: function (password, salt) {
    return crypto.createHmac('sha256', salt)
      .update(password, 'utf8').digest('hex')
  },

  generateSalt () {
    crypto.randomBytes(20).toString('hex')
  },

  /**
   *
   * @param res
   * @param error
   */

  registerError: function (res, error) {
    LabGroups.find({}).populate('owner').exec(function (err, labs) {
      return res.view('account/register', {title: 'Rejestracja', labs: labs, error: err || error})
    })
  },

  settingsMessage (res, message, labs) {
    return res.view('account/settings', {title: 'Settings', message: message, labs: labs})
  },

  // Controller Actions

  /**
   * @description :: Login to system
   * @route       :: /login
   */
  login: function (req, res) {
    if (req.session.authed) {
      return res.redirect('/')
    }
    switch (req.method) {
      case 'GET':
        return res.view('account/login', {title: 'Logowanie', redirect: req.param('redirect'), loginpage: true})
      case 'POST':
        let email = req.param('email')
        let password = req.param('password')
        let red = req.param('redirect')
        if (!_.isString(email) || !_.isString(password) ||
          !email || !password) {
          return AccountController.loginError(res, 'Źle wporwadzone dane')
        }
        Users.findOne({email: email}).populate('roles').exec(function (err, user) {
          if (err) {
            return res.jsonx(err)
          }
          if (!user) {
            return AccountController.loginError(res, 'Błędna kombinacja użytkownika i hasła')
          }
          if (user.password === AccountController.hashPassword(password, user.salt)) {
            if (!user.activated) {
              return AccountController.loginError(res, 'Konto nie jest aktywne')
            }
            req.session.authed = user.id
            if (_.isString(red)) {
              return res.redirect(red)
            } else {
              if (user.hasRole('teacher')) {
                return res.redirect(sails.getUrlFor('TeacherController.index'))
              }
              return res.redirect(sails.getUrlFor('AccountController.index'))
            }
          } else {
            return AccountController.loginError(res, 'Błędna kombinacja użytkownika i hasła')
          }
        })
        break
      default:
        return res.badRequest()
    }
  },

  /**
   * @description :: Logout from system
   * @route       :: /logout
   */
  logout: function (req, res) {
    if (req.session.authed) {
      req.session.authed = null
    }
    return res.redirect('/login')
  },

  /**
   * @description :: Register to system
   * @route       :: /register
   */
  register: function (req, res) {
    switch (req.method) {
      case 'GET':
        LabGroups.find({}).populate('owner').exec(function (err, labs) {
          if (err) {
            return res.serverError(err)
          }
          return res.view('account/register', {title: 'Rejestracja', labs: labs, registerpage: true})
        })
        break
      case 'POST':
        let name = req.param('name')
        let album = req.param('album')
        let surname = req.param('surname')
        let email = req.param('email')
        let password = req.param('password')
        let rePassword = req.param('repassword')
        let labGroups = req.param('groupl')
        let st = crypto.randomBytes(20).toString('hex')
        if (!name && !surname && !email && !password) {
          return AccountController.registerError(res, 'Proszę uzupełnić wszystkie pola.')
        }
        if (name.length > 255) {
          return AccountController.registerError(res, 'Imię jest za długie')
        }
        if (surname.length > 255) {
          return AccountController.registerError(res, 'Nazwisko jest za długie')
        }
        let regexEmail = /^\w+@(p\.lodz\.pl)|\w+@(edu\.p\.lodz\.pl)$/
        if (!regexEmail.test(email)) {
          return AccountController.registerError(res, 'Rejestracja dostępna tylko z uczelnienych maili')
        }
        if (email.length > 255) {
          return AccountController.registerError(res, 'E-mail jest za długie')
        }
        if (album.length !== 6) {
          return AccountController.registerError(res, 'Numer albumu jest nieprawidłowy.')
        }
        if (password !== rePassword) {
          return AccountController.registerError(res, 'Hasła nie są identyczne')
        }
        if (password.length > 255) {
          return AccountController.registerError(res, 'Hasło jest za długie')
        }
        if (password.length < 8) {
          return AccountController.registerError(res, 'Hasło jest za krótkie. Powinno zawierać 8 znaków.')
        }

        switch (Users.validatePassword(password)) {
          case 1:
            return AccountController.registerError(res, 'Hasło jest za krótkie. Powinno zawierać 8 znaków.')
          case 2:
            return AccountController.registerError(res, 'Twoje hasło powinno zawierać dużą i małą litere')
        }

        // TODO: sprawdzic Dean & Lab
        Roles.findOne({name: 'student'}).exec(function (err, role) {
          if (err) {
            return res.jsonx(err)
          }

          LabGroups.findOne({name: labGroups}).exec(function (err, lab) {
            if (err) {
              res.jsonx(err)
            }
            if (!lab) {
              return AccountController.registerError(res, 'Nieprawidłowa grupa laboratoryjna.')
            }
            Users.create({
              name: name,
              surname: surname,
              album: album,
              email: email,
              password: AccountController.hashPassword(password, st),
              salt: st,
              activated: true,
              roles: role,
              labGroups: [lab]
            }).exec(function (err) {
              if (err) {
                return res.serverError(err)
              }

              return res.redirect(sails.getUrlFor('AccountController.login'))
            })
          })
        })
    }
  },

  /***
   * @description :: Main student view, exposes topics to student or tasks in topic
   * @route       :: /
   * @route       :: /topic/:topicid/tasks
   */
  index: function (req, res) {
    if (req.localUser.hasRole('student')) {
      StudentsLabGroups.findOne({
        student: req.localUser.id /* TODO: , active: true */
      }).populate('labgroup').exec(function (err, lab) {
        if (err) {
          return res.serverError(err)
        }
        if (!lab) {
          return res.forbidden('Nie jesteś przydzielony do żadnej grupy')
        }

        sails.sendNativeQuery('SELECT topics.id topicId, topics.number topicNumber, topics.title topicTitle, topics.deadline topicDeadline, \n' +
          '    COUNT(tasks.id) taskCount, \n' +
          '    COUNT(replies.id) repliesCount, \n' +
          '    sum(case when replies.teacherStatus = 1 then 1 else 0 end) repliesTeacherAccepted,\n' +
          '    sum(case when replies.teacherStatus = 2 then 1 else 0 end) repliesTeacherRejected,\n' +
          '    sum(case when replies.blocked = 1 then 1 else 0 end) repliesBlocked,\n' +
          '    COUNT(DISTINCT comments.task) repliesCommented,\n' +
          '    sum(case when replies.machineStatus = 2 then 1 else 0 end) repliesMachineAccepted,\n' +
          '    sum(case when replies.machineStatus = 3 then 1 else 0 end) repliesMachineRejected,\n' +
          '    sum(case when (replies.machineStatus = 2 and replies.teacherStatus = 1) then 1 else 0 end) repliesAccepted\n' +
          '    FROM topics\n' +
          'LEFT JOIN tasks ON tasks.topic = topics.id\n' +
          'LEFT JOIN taskreplies AS replies ON replies.task = tasks.id AND replies.student = $1 \n' +
          'LEFT JOIN ( SELECT task, taskStudent FROM taskcomments GROUP BY task, taskStudent ) comments ON comments.task = tasks.id AND comments.taskStudent = $1\n' +
          'GROUP BY topics.id', [req.localUser.id]).exec((err, data) => {
            if (err) {
              return res.serverError(err)
            }
            let ret = {message: lab.labgroup.message, topics: data.rows}
            let taskView = parseInt(req.param('topicid'))
            if (!isNaN(taskView)) {
              ret.taskView = taskView
            }
            return res.view('account/index', {data: ret})
          }
        )
      })
    } else {
      return res.redirect(sails.getUrlFor('TeacherController.index'))
    }
  },

  /***
   * @description :: Ajax api for getting list of task in selected topic
   * @route       :: /ajax/topic/:id/tasks
   */
  tasks: function (req, res) {
    if (req.localUser.hasRole('student')) {
      StudentsLabGroups.findOne({
        student: req.localUser.id /* TODO: , active: true */
      }).exec(function (err, lab) {
        if (err) {
          return res.serverError(err)
        }
        let topicId = req.param('id')
        Topics.count({'id': topicId}, (err, count) => {
          if (err) {
            return res.serverError(err)
          }
          if (count !== 1) {
            return res.notFound()
          }
          sails.sendNativeQuery('SELECT tasks.id, tasks.number, tasks.title,\n' +
            '(case when reply.id IS NOT NULL then 1 else 0 end) hasReply,\n' +
            '(case when comments.task IS NOT NULL then 1 else 0 end) hasComments,\n' +
            '(case when reply.id IS NOT NULL then reply.teacherStatus else 0 end) teacherStatus,\n' +
            '(case when reply.id IS NOT NULL then reply.machineStatus else 0 end) machineStatus,\n' +
            '(case when scd.task IS NOT NULL then scd.deadline else\n' +
            ' (case when groupdeadline.deadline IS NOT NULL then groupdeadline.deadline else topics.deadline end) end) deadline\n' +
            'FROM tasks\n' +
            'LEFT JOIN taskreplies reply ON reply.task = tasks.id AND reply.student = $1 \n' +
            'LEFT JOIN taskcomments comments ON comments.task = tasks.id AND comments.viewed = false\n' +
            'LEFT JOIN topics ON topics.id = tasks.topic\n' +
            'LEFT JOIN studentcustomdeadlines scd ON scd.task = tasks.id AND scd.student = $1 \n' +
            'LEFT JOIN labgrouptopicdeadline groupdeadline ON groupdeadline.group = $2 \n' +
            'WHERE tasks.topic = $3 \n' +
            'GROUP BY tasks.id, reply.id, tasks.topic, scd.deadline, groupdeadline.deadline',
            [req.localUser.id, lab.labgroup, topicId]).exec((err, data) => {
              if (err) {
                return res.serverError(err)
              }
              return res.json(data.rows)
            }
          )
        })
      })
    } else {
      return res.badRequest()
    }
  },
  task: function (req, res) {
    if (req.localUser.hasRole('student')) {
      switch (req.method) {
        case 'GET':

          let topicparam = req.param('topicid')
          let taskparam = req.param('taskid')

          Topics.findOne({id: topicparam}).exec(function (err, topic) {
            if (err) {
              return res.badRequest(err)
            }

            if (!topic) {
              return res.notFound()
            }

            Tasks.findOne({id: taskparam}).populate('description').exec(function (err, task) {
              if (err) {
                return res.badRequest(err)
              }

              if (!task) {
                return res.notFound()
              }

              task.description = task.description[0].description

              TaskComments.find({task: task.id, taskStudent: req.localUser.id})
                .populate('user').exec(function (err, taskComments) {
                  if (err) {
                    return res.serverError(err)
                  }

                  TaskReplies.findOne({student: req.localUser.id, task: task.id})
                  .exec(function (err, taskReply) {
                    if (err) {
                      return res.badRequest(err)
                    }
                    if (!taskReply) {
                      return res.view('account/task', {
                        topic: topic,
                        task: task,
                        taskReply: taskReply,
                        taskReplyFiles: null,
                        taskComments: taskComments
                      })
                    }
                    TaskReplyFiles.find({reply: taskReply.id})
                      .exec(function (err, taskReplyFiles) {
                        if (err) {
                          return res.badRequest(err)
                        }
                        pdc(task.description[0], 'markdown_github', 'html5', function (err, result) {
                          if (err) {
                            return res.serverError(err)
                          }
                          task.description = result

                          return res.view('account/task', {
                            topic: topic,
                            task: task,
                            taskReply: taskReply,
                            taskReplyFiles: taskReplyFiles,
                            taskComments: taskComments
                          })
                        })
                      })
                  })
                })
            })
          })
          break

        case 'POST':

          let task = req.param('taskid')
          let action = req.param('action')
          let comment = req.param('comment')

          // Ajax
          Tasks.count({id: task}, (err, count) => {
            if (err) {
              return res.serverError(err)
            }
            if (count === 0) {
              return res.notFound()
            }
            if (action === 'markAsRead') {
              TaskComments.update({task: task, taskStudent: req.localUser.id, viewed: false}, {viewed: true})
                .exec(function (err) {
                  if (err) {
                    return res.serverError(err)
                  }
                  return res.json({ 'err': false })
                })
            } else if (action === 'sendComment') {
              TaskComments.create(
                {task: task, taskStudent: req.localUser.id, user: req.localUser.id, comment: comment, viewed: false})
                .exec(function (err) {
                  if (err) {
                    return res.serverError(err)
                  }
                  return res.json({ 'err': false })
                })
            }
          })
      }
    } else {
      return res.badRequest()
    }
  },

  ajaxCommentsCheck: function (req, res) {
    const taskId = req.param('task')
    const lastComment = req.param('lastComment')

    if (req.method === 'GET') {
      Tasks.findOneById(taskId).exec(function (err, taskw) {
        if (err) {
          return res.json(err)
        }

        TaskComments.find({task: taskw.id, taskStudent: req.localUser.id, id: {'>': lastComment}}).populate('user')
          .exec(function (err, task) {
            if (err) {
              return res.json(err)
            }

            return res.json(task)
            // return res.json({
            //   id: resTask.id,
            //   taskStudent: resTask.taskStudent,
            //   user: resTask.user,
            //   comment: resTask.comment,
            //   viewed: resTask.viewed
            // })
          })
      })
    }
  },

  userSettings: function (req, res) {
    switch (req.method) {
      case 'GET':

        Users.findOne({id: req.localUser.id}).exec(function (err, user) {
          if (err) {
            return res.json(err)
          }
          LabGroups.find().populate('owner').exec(function (err, labs) {
            if (err) {
              return res.json(err)
            }

            return res.view('account/settings', {user: user, labs: labs})
          })
        })
        break
      case 'POST':
        let action = req.param('action')
        let oldPassword = req.param('oldPass')
        let password = req.param('password')
        let rePassword = req.param('repassword')
        let lab = req.param('lab')
        let confpass = req.param('passlabconf')

        Users.findOne({id: req.localUser.id}).exec(function (err, user) {
          if (err) {
            return res.json(err)
          }

          // ZMIANA HASŁA
          if (action === 'newPassword') {
            LabGroups.find().populate('owner').exec(function (err, labs) {
              if (err) {
                return res.json(err)
              }
              if (user.password === AccountController.hashPassword(oldPassword, user.salt)) {
                if (password !== rePassword) {
                  return AccountController.settingsMessage(res, 'Hasła nie są identyczne', labs)
                }
                if (password.length < 8) {
                  return AccountController.settingsMessage(res, 'Hasło jest za krótkie. Powinno zawierać 8 znaków.', labs)
                }

                switch (Users.validatePassword(password)) {
                  case 1:
                    return AccountController.settingsMessage(res, 'Hasło jest za krótkie. Powinno zawierać 8 znaków.', labs)
                  case 2:
                    return AccountController.settingsMessage(res, 'Twoje hasło powinno zawierać dużą i małą litere', labs)
                }
                user.password = AccountController.hashPassword(password, user.salt)

                user.save({populate: false}, function (err) {
                  if (err) {
                    return res.json(err)
                  }
                  return AccountController.settingsMessage(res, 'Hasło zostało zmienione.', labs)
                })
              } else {
                return AccountController.settingsMessage(res, 'Stare hasło jest nieprawidłowe', labs)
              }
            })
            // Dodac lab
          } else if (action === 'newLab') {
          // ZMIANA LAB GRUPY

            LabGroups.findOne({name: lab}).populate('owner').exec(function (err, lab) {
              if (err) {
                return res.json(err)
              }
              LabGroups.find().populate('owner').exec(function (err, labs) {
                if (err) {
                  return res.json(err)
                }
                Users.findOne({id: req.localUser.id}).exec(function (err, user) {
                  if (err) {
                    return res.json(err)
                  }

                  if (lab === undefined) {
                    lab = user.labGroups
                  }

                  if (user.password === AccountController.hashPassword(confpass, user.salt)) {
                    user.labGroups = lab

                    user.save({populate: false}, function (err) {
                      if (err) {
                        return res.badRequest(err)
                      }
                        // DODAĆ ACTION ŻEBY SPRFAWDZIĆ KTÓRY FORM
                      return AccountController.settingsMessage(res, 'Zmieniono grupę laboratoryjną.', labs)
                    })
                  } else {
                    return AccountController.settingsMessage(res, 'Hasło jest niepoprawne', labs)
                  }
                })
              })
            })
          }
        })
    }
  }
}
