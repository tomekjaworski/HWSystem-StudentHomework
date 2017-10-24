/**
 * UserController
 *
 * @description :: Server-side logic for managing User
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const crypto = require('crypto')
const UserController = module.exports = {

  hashPassword: function (password, salt) {
    return crypto.createHmac('sha256', salt)
      .update(password, 'utf8').digest('hex')
  },

  generateSalt () {
    crypto.randomBytes(20).toString('hex')
  },

  listUser: function (req, res) {
    Users.find().exec(function (err, users) {
      if (err) {
        return res.serverError(err)
      }

      return res.view('teacher/user/list', {users: users, menuItem: 'users'})
    })
  },

  addUser: function (req, res) {
    let a = (attr, msg, param) => Users.find({isTeacher: true}).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError(req.i18n.__('teacher.labs.noteachers'))
      }
      LabGroups.find().populate('owner').exec(function (err, labs) {
        if (err) {
          return res.serverError(err)
        }
        return res.view('teacher/user/add',
          {
            title: req.i18n.__('teacher.users.title'),
            users: users,
            labs: labs,
            message: {message: msg, attribute: attr},
            param: param,
            menuItem: 'users'
          })
      })
    })
    if (req.method === 'POST') {
      let name = req.param('name')
      let surname = req.param('sur')
      let album = req.param('album')
      let admin = req.param('admin')
      let teacher = req.param('teacher')
      let email = req.param('email')
      let pass = req.param('pass')
      let repass = req.param('repass')
      let active = req.param('active')
      let lab = parseInt(req.param('groupl'))
      let st = crypto.randomBytes(20).toString('hex')
      if (!name || !surname || !email || !pass || !repass) {
        return a('danger', req.i18n.__('teacher.labs.fillall'), req.param)
      }
      if (pass !== repass) {
        return a('danger', req.i18n.__('teacher.users.repass.fail'), req.param)
      }
      admin = !!(admin)
      teacher = !!(teacher)
      active = !!(active)

      if (admin && !teacher) {
        return res.badRequest('Admin musi być prowadzącym')
      }
      if (album && teacher) {
        return res.badRequest('Prowadzący nie powiniem posiadać albumu')
      } else if (!album && !teacher) {
        return a('danger', req.i18n.__('teacher.labs.fillall'), req.param)
      }
      if ((lab && lab !== '0') && teacher) {
        return res.badRequest('Prowadzący nie powiniem znajdować się w labgrupie')
      } else if ((!lab || lab === '0') && !teacher) {
        return a('danger', req.i18n.__('teacher.labs.fillall'), req.param)
      }

      Users.create({
        name: name,
        surname: surname,
        album: album === '' ? null : album,
        isTeacher: teacher,
        isAdmin: admin,
        email: email,
        password: UserController.hashPassword(pass, st),
        salt: st,
        activated: active,
        labGroups: lab === 0 ? [] : lab
      }).exec(function (err) {
        if (err) {
          return res.serverError(err)
        }

        return res.redirect('/teacher/users')
      })
    } else {
      a()
    }
  },
  editUser: function (req, res) {
    // eslint-disable-next-line no-unused-vars
    let id = req.param('id')
    Users.findOne({id: id}).populate('labGroups').exec(function (err, user) {
      if (err) {
        return res.serverError(err)
      }
      LabGroups.find().populate('owner').exec(function (err, labs) {
        if (err) {
          return res.serverError(err)
        }
        return res.view('teacher/user/editUser', {menuItem: 'users', user: user, labs: labs})
      })
    })
    if (req.method === 'POST') {

    }
  },
  userProfile: function (req, res) {
    let id = req.param('id')
    Users.findOne({id: id}).populate('labGroups').exec(function (err, user) {
      if (err) {
        return res.serverError(err)
      }
      LabGroups.find({owner: user.id}).exec(function (err, labs) {
        if (err) {
          return res.serverError(err)
        }

        return res.view('teacher/user/profile', {user: user, labs: labs, menuItem: 'users'})
      })
    })
  }
}
