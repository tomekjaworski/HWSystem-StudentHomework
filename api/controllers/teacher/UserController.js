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

  listUser (req, res) {
    Users.find().exec(function (err, users) {
      if (err) {
        return res.serverError(err)
      }

      return res.view('teacher/user/list', { users: users, menuItem: 'users' })
    })
  },

  addUser (req, res) {
    let a = (msg) => Users.find({ isTeacher: true }).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }
      LabGroups.find().populate('owner').exec(function (err, labs) {
        if (err) {
          return res.serverError(err)
        }
        return res.view('teacher/user/add',
          {title: 'User :: Teacher Panel', users: users, labs: labs, message: msg, menuItem: 'users'})
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
      let lab = req.param('groupl')
      let st = crypto.randomBytes(20).toString('hex')
      if (!name || !surname || !album || !email || !pass || !repass || !lab) {
        return a('Uzupełni wszystkie pola')
      }
      if (pass !== repass) {
        return a('Hasła nie są identyczne')
      }
      admin = !!(admin)
      teacher = !!(teacher)
      active = !!(active)

      Users.create({
        name: name,
        surname: surname,
        album: album,
        isTeacher: teacher,
        isAdmin: admin,
        email: email,
        password: UserController.hashPassword(pass, st),
        salt: st,
        activated: active,
        labGroups: lab
      }).exec(function (err) {
        if (err) {
          return res.serverError(err)
        }

        return res.redirect('/teacher/users')
      })
    } else {
      a()
    }
  }
}
