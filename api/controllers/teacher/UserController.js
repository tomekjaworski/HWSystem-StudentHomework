/**
 * UserController
 *
 * @description :: Server-side logic for managing User
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const UserController = module.exports = {
  listUser: function (req, res) {
    Users.find().exec(function (err, users) {
      if (err) {
        return res.serverError(err)
      }

      return res.view('teacher/user/list', {users: users})
    })
  },

  addUser: function (req, res) {
    let a = (msg) => Users.find({isTeacher: true }).exec((err, users) => {
      if (err) {
        return res.serverError(err)
      }
      if (!users || users.length === 0) {
        return res.serverError('Nie znaleziono roli prowadzącego, zgłoś się do administratora')
      }
      return res.view('teacher/user/add',
          {title: 'User :: Teacher Panel', users: users, message: msg, menuItem: 'user'})
    })
    if (req.method === 'POST'){

    } else {
      a()
    }
  }
}
