/**
 * TeacherController
 *
 * @description :: Server-side logic for managing Teachers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

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
    let a = (attr, msg) => LabGroups.findOne({id:id}).exec((err, lab) => {
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
          {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', data: lab, message: {message: msg, attribute: attr}})
      })
    })

    if (req.method === 'POST') {
      let message = req.param('message')
      if (!!message && message !== '') {
        LabGroups.update({id: id}, {message: message}).exec((err) => {
          if (err) return res.serverError(err)
          a('info', 'Pomyślnie ustawiono wiadomość')
        })
      } else {
        a()
      }
    } else {
      let deactive = req.param('deactive')
      if (deactive) {
        StudentsLabGroups.update({student: deactive, labgroup: id, active: true}, {active: false}).meta({fetch:true}).exec((err, slg) => {
          if (err) return res.serverError(err)
          if (!slg || slg.length !== 1) return a('danger', 'Błędny uzytkownik')
          a('info', 'Pomyślnie deaktywowano użytkownika w grupie')
        })
      } else {
        a()
      }
    }
  },

  viewNewStudentsLabGroup: function (req, res) {
    let id = req.param('id')
    let a = (attr, msg) => LabGroups.findOne({id:id}).exec((err, lab) => {
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
          {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', data: lab, message: {message: msg, attribute: attr}})
      })
    })
    let active = req.param('active')
    if (active) {
      StudentsLabGroups.update({student: active, labgroup: id, active: false}, {active: true}).meta({fetch:true}).exec((err, slg) => {
        if (err) return res.serverError(err)
        if (!slg || slg.length !== 1) return a('danger', 'Błędny uzytkownik')
        a('info', 'Pomyślnie aktywowano użytkownika w grupie')
      })
    } else {
      a()
    }
  },

  addLabGroup: function (req, res) {
    let a = (msg) => Roles.findOne({name:'teacher'}).populate('users').exec((err, role) => {
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
      }).meta({fetch:true}).exec((err, lab) => {
        if (err) return res.serverError(err)
        if (!lab) return res.serverError('Nie udało sie uwtorzyć grupy')
        return res.redirect('/teacher/labgroup/view/' + lab.id)
      })
    } else {
      a()
    }
  },

  editLabGroup: function (req, res) {
    let id = req.param('id')
    let a = (attr, msg) => Roles.findOne({name:'teacher'}).populate('users').exec((err, role) => {
      if (err) {
        return res.serverError(err)
      }
      if (!role) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }
      LabGroups.findOne({id:id}).exec((err, lab) => {
        if (err) {
          return res.serverError(err)
        }
        if (!lab) {
          return res.notFound()
        }
        return res.view('teacher/labgroups/edit',
          {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', data: lab, users: role.users, message: {message: msg, attribute: attr}})
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
        if (err) return res.serverError(err)
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
      if (err) return res.serverError(err)
      return res.view('teacher/replies/index', {title: 'Task Replies :: Teacher Panel', menuItem: 'replies', data: topics})
    })
  },

  viewTaskReplies: function (req, res) {
    let id = req.param('taskid')
    Tasks.findOne(id).populate('topic').exec((err, task) => {
      if (err) return res.serverError(err)
      if (!task) return res.notFound()
      LabGroups.find({select: ['name', 'id', 'owner']}).populate('owner').exec((err, labs) => {
        if (err) return res.serverError(err)
        if (!labs) return res.serverError('Nie zdefiniowano żadnych grup laboratoryjnych')
        task.labs = labs
        return res.view('teacher/replies/view', {title: 'Task Replies :: Teacher Panel', menuItem: 'replies', data: task})
      })
    })
  },

  viewTaskOfLab: function (req, res) {
    return res.send('aaa')
  }
}
