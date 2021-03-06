/* eslint-disable no-unused-vars */
/**
 * LabsController
 *
 * @description :: Server-side logic for managing Labs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const dateFormat = require('dateformat')

const LabsController = module.exports = {
  listLabGroups: function (req, res) {
    let show = req.param('show')
    let cond = 'SELECT `labgroups`.`id`, `labgroups`.`active`, `labgroups`.`name`, `labgroups`.`description`, COUNT(DISTINCT `sa`.`id`) `studentsCount`, COUNT(DISTINCT `sna`.`id`) `studentsNotCount`, `users`.`name` as ownerName, `users`.`surname` as ownerSurname FROM `labgroups` \n' +
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
        {
          title: req.i18n.__('teacher.labs.teacherpanel'),
          menuItem: 'labgroups',
          data: groups.rows,
          show: show,
          breadcrumb: 'list'
        })
    })
  },

  viewLabGroup: function (req, res) {
    let id = parseInt(req.param('id'), '10')
    if (!_.isInteger(id)) {
      return res.notFound()
    }
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
        lab.students = students.sort((a, b) => a.student.surname.localeCompare(b.student.surname))
        StudentsLabGroups.count({labgroup: id, active: false}).exec((err, count) => {
          if (err) {
            return res.serverError(err)
          }
          lab.notActive = count
          return res.view('teacher/labgroups/view',
            {
              title: req.i18n.__('teacher.labs.teacherpanel'),
              menuItem: 'labgroups',
              data: lab,
              message: {message: msg, attribute: attr},
              breadcrumb: 'view'
            })
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
          a('info', req.i18n.__('teacher.labs.message.set'))
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
              return a('danger', req.i18n.__('teacher.labs.deactivate.error'))
            }
            a('info', req.i18n.__('teacher.labs.deactivate.success'))
          })
      } else {
        a()
      }
    }
  },

  labGroupDeadlines: function (req, res) {
    let id = parseInt(req.param('id'), '10')
    if (!_.isInteger(id)) {
      return res.notFound()
    }
    let a = (attr, msg) => LabGroups.findOne(id).exec((err, lab) => {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return res.notFound()
      }
      Topics.find({visible: true}).exec((err, topics) => {
        if (err) {
          return res.serverError(err)
        }
        LabGroupTopicDeadline.find({group: id}).exec((err, deadlines) => {
          if (err) {
            return res.serverError(err)
          }
          topics = _.forEach(topics, (t) => {
            let custom = _.find(deadlines, d => d.topic === t.id)
            try {
              t.deadline = dateFormat((custom ? custom.deadline : t.deadline), 'yyyy-mm-dd')
              t.custom = !!custom
            } catch (err) {
              return res.serverError(err)
            }
          })
          lab.topics = topics
          return res.view('teacher/labgroups/deadlines',
            {
              title: req.i18n.__('teacher.labs.teacherpanel'),
              menuItem: 'labgroups',
              data: lab,
              message: {message: msg, attribute: attr},
              breadcrumb: 'view'
            })
        })
      })
    })
    if (req.method === 'POST') {
      let date = req.param('date')
      let topic = parseInt(req.param('topic'), '10')
      if (!_.isInteger(topic)) {
        return res.notFound()
      }
      if (!date) {
        LabGroupTopicDeadline.destroy({group: id, topic: topic}).exec((err) => {
          if (err) {
            return res.serverError(err)
          }
          return res.ok()
        })
      } else {
        date = Date.parse(date)
        if (isNaN(date)) {
          return res.badRequest()
        }
        LabGroupTopicDeadline.findOrCreate({group: id, topic: topic}, {
          group: id,
          topic: topic,
          deadline: date
        }).exec((err, deadline, created) => {
          if (err) {
            return res.serverError(err)
          }
          if (!created) {
            LabGroupTopicDeadline.update(deadline.id, {deadline: date}).exec((err) => {
              if (err) {
                return res.serverError(err)
              }
              return res.ok()
            })
          } else {
            return res.ok()
          }
        })
      }
    } else {
      a()
    }
  },

  viewNewStudentsLabGroup: function (req, res) {
    let id = parseInt(req.param('id'), '10')
    if (!_.isInteger(id)) {
      return res.notFound()
    }
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
        lab.students = students.sort((a, b) => a.student.name.localeCompare(b.student.name))
        StudentsLabGroups.count({labgroup: id, active: true}).exec((err, count) => {
          if (err) {
            return res.serverError(err)
          }
          lab.activeStudents = count
          return res.view('teacher/labgroups/viewNewStudents',
            {
              title: req.i18n.__('teacher.labs.teacherpanel'),
              menuItem: 'labgroups',
              data: lab,
              message: {message: msg, attribute: attr},
              breadcrumb: 'viewnew'
            })
        })
      })
    })
    let active = req.param('active')
    let message = req.param('message')
    if (active) {
      StudentsLabGroups.update({student: active, labgroup: id, active: false}, {active: true}).meta({fetch: true})
        .exec((err, slg) => {
          if (err) {
            return res.serverError(err)
          }
          if (!slg || slg.length !== 1) {
            return a('danger', req.i18n.__('teacher.labs.activate.error'))
          }
          a('info', req.i18n.__('teacher.labs.activate.success'))
        })
    } else if (message) {
      res.status(307)
      res.location('/teacher/labgroup/view/' + id)
      return res.send()
    } else {
      a()
    }
  },

  addLabGroup: function (req, res) {
    let a = (msg) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError(req.i18n.__('teacher.labs.noteachers'))
      }
      return res.view('teacher/labgroups/add',
        {
          title: req.i18n.__('teacher.labs.teacherpanel'),
          menuItem: 'labgroups',
          users: users,
          message: msg,
          breadcrumb: 'add'
        })
    })
    if (req.method === 'POST') {
      let title = req.param('title')
      let desc = req.param('desc')
      let active = req.param('active')
      let owner = req.param('owner')
      if (!_.isString(title) || !_.isString(desc) || !_.isString(owner) ||
        !title || !desc || !owner) {
        return a(req.i18n.__('teacher.labs.fillall'))
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
          return res.serverError(req.i18n.__('teacher.labs.add.error'))
        }
        return res.redirect('/teacher/labgroup/view/' + lab.id)
      })
    } else {
      a()
    }
  },

  delLabGroup: function (req, res) {
    let id = parseInt(req.param('id'), '10')
    if (!_.isInteger(id)) {
      return res.notFound()
    }
    LabGroups.findOne(id).populate('students').exec((err, lab) => {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return res.notFound()
      }
      StudentsLabGroups.destroy({student: lab.students.map(s => s.id)}).exec((err) => {
        if (err) {
          return res.serverError(err)
        }
        LabGroups.destroy(id).exec((err) => {
          if (err) {
            return res.serverError(err)
          }
          return res.redirect('/teacher/labgroup')
        })
      })
    })
  },

  editLabGroup: function (req, res) {
    let id = parseInt(req.param('id'), '10')
    if (!_.isInteger(id)) {
      return res.notFound()
    }
    let a = (attr, msg) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError(req.i18n.__('teacher.labs.noteachers'))
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
            title: req.i18n.__('teacher.labs.teacherpanel'),
            menuItem: 'labgroups',
            data: lab,
            users: users,
            message: {message: msg, attribute: attr},
            breadcrumb: 'edit'
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
        return a('danger', req.i18n.__('teacher.labs.fillall'))
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
        return a('info', req.i18n.__('teacher.labs.edit.success'))
      })
    } else {
      a()
    }
  }
}
