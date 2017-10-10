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
    let cond = 'SELECT `labgroups`.`id`, `labgroups`.`active`, `labgroups`.`name`, COUNT(DISTINCT `sa`.`id`) `studentsCount`, COUNT(DISTINCT `sna`.`id`) `studentsNotCount`, `users`.`name` as ownerName, `users`.`surname` as ownerSurname FROM `labgroups` \n' +
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
        {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', data: groups.rows, show: show, breadcrumb: 'list'})
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
        lab.students = students
        StudentsLabGroups.count({labgroup: id, active: false}).exec((err, count) => {
          if (err) {
            return res.serverError(err)
          }
          lab.notActive = count
          return res.view('teacher/labgroups/view',
            {
              title: 'LabGroups :: Teacher Panel',
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

  labGroupDeadlines: function (req, res) {
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
      Topics.find({visible: true}).exec((err, topics) => {
        if (err) {
          return res.serverError(err)
        }
        topics = _.forEach(topics, (t) => {
          t.deadline = dateFormat(t.deadline, 'yyyy-mm-dd')
        })
        lab.topics = topics
        return res.view('teacher/labgroups/deadlines',
          {
            title: 'LabGroups :: Teacher Panel',
            menuItem: 'labgroups',
            data: lab,
            message: {message: msg, attribute: attr},
            breadcrumb: 'view'
          })
      })
    })
    a()
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
        lab.students = students
        StudentsLabGroups.count({labgroup: id, active: true}).exec((err, count) => {
          if (err) {
            return res.serverError(err)
          }
          lab.activeStudents = count
          return res.view('teacher/labgroups/viewNewStudents',
            {
              title: 'LabGroups :: Teacher Panel',
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
            return a('danger', 'Błędny uzytkownik')
          }
          a('info', 'Pomyślnie aktywowano użytkownika w grupie')
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
        return res.serverError('Nie znaleziono prowadzących, zgłoś się do administratora')
      }
      return res.view('teacher/labgroups/add',
        {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', users: users, message: msg, breadcrumb: 'add'})
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
        return res.serverError('Nie znaleziono prowadzących, zgłoś się do administratora')
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
  }
}
