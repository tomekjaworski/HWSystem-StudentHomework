/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const crypto = require('crypto')

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
   * @description :: Redirect user based on if authed and if user or teacher
   * @route       :: /login
   */
  index: function (req, res) {
    if(!req.localUser){
      return res.view('homepage');
    }
    if(req.localUser.hasRole('student')){
      return res.redirect(sails.getUrlFor('StudentController.index'))
    }
    if(req.localUser.hasRole('teacher')){
      return res.redirect(sails.getUrlFor('TeacherController.index'))
    }
    return res.serverError();
  },

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
              return res.redirect(sails.getUrlFor('StudentController.index'))
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
