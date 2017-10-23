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
  loginError (res, err) {
    return res.view('account/login', {title: 'Logowanie', error: err})
  },

  /**
   * @description     :: Hash password with given salt
   * @param password  :: Password to hash
   * @param salt      :: Salt to hash password
   * @returns {*}     :: Hashed password
   */
  hashPassword (password, salt) {
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

  registerError (req, res, error) {
    LabGroups.find({select: ['id', 'owner', 'name']}).populate('owner').exec(function (err, labs) {
      if (err) {
        return res.serverError(err)
      }
      return res.view('account/register', {
        title: req.i18n.__('register.header'),
        labs: labs,
        error: err || error,
        param: req.param
      })
    })
  },

  settingsMessage (req, res, message, labs) {
    return res.view('account/settings', {title: req.i18n.__('settings.title'), message: message, labs: labs})
  },

  // Controller Actions

  /**
   * @description :: Redirect user based on if authed and if user or teacher
   * @route       :: /login
   */
  index (req, res) {
    if (!req.localUser) {
      return res.view('homepage')
    }
    if (!req.localUser.isTeacher) {
      return res.redirect(sails.getUrlFor('StudentController.index'))
    } else {
      return res.redirect(sails.getUrlFor('TeacherController.index'))
    }
  },

  /**
   * @description :: Login to system
   * @route       :: /login
   */
  login (req, res) {
    if (req.session.authed) {
      return res.redirect('/')
    }
    switch (req.method) {
      case 'GET':
        return res.view('account/login', {
          title: req.i18n.__('login.header'),
          redirect: req.param('redirect'),
          loginpage: true
        })
      case 'POST':
        let email = req.param('email')
        let password = req.param('password')
        let red = req.param('redirect')
        if (!_.isString(email) || !_.isString(password) ||
          !email || !password) {
          return AccountController.loginError(res, req.i18n.__('login.error.badrequest'))
        }
        Users.findOne({email: email}).exec(function (err, user) {
          if (err) {
            return res.serverError(err)
          }
          if (!user) {
            return AccountController.loginError(res, req.i18n.__('login.error.credentials'))
          }
          if (user.password === AccountController.hashPassword(password, user.salt)) {
            if (!user.activated) {
              return AccountController.loginError(res, req.i18n.__('login.error.inactive'))
            }
            req.session.authed = user.id
            if (_.isString(red)) {
              return res.redirect(red)
            } else {
              if (user.isTeacher) {
                return res.redirect(sails.getUrlFor('TeacherController.index'))
              }
              return res.redirect(sails.getUrlFor('StudentController.index'))
            }
          } else {
            return AccountController.loginError(res, req.i18n.__('login.error.credentials'))
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
  logout (req, res) {
    if (req.session.authed) {
      req.session.authed = null
    }
    return res.redirect('/login')
  },

  /**
   * @description :: Register to system
   * @route       :: /register
   */
  register (req, res) {
    if (req.session.authed) {
      return res.redirect('/')
    }
    switch (req.method) {
      case 'GET':
        LabGroups.find({active: true}).populate('owner').exec(function (err, labs) {
          if (err) {
            return res.serverError(err)
          }
          return res.view('account/register', {title: req.i18n.__('register.header'), labs: labs, registerpage: true})
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
        if (!name || !surname || !email || !password || !album) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.fillall'))
        }
        if (name.length > 255) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.name'))
        }
        if (surname.length > 255) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.surname'))
        }
        let regexEmail = /^\w+@(p\.lodz\.pl)|\w+@(edu\.p\.lodz\.pl)$/
        if (!regexEmail.test(email)) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.email.domain'))
        }
        if (email.length > 255) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.email.toolong'))
        }
        // todo: może tak być?, parseInt tu dodałem
        if (parseInt(album.length) !== 6) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.album'))
        }
        if (password !== rePassword) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.repassword'))
        }
        if (password.length > 255) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.password.long'))
        }
        if (password.length < 8) {
          return AccountController.registerError(req, res, req.i18n.__('register.error.password.short'))
        }

        switch (Users.validatePassword(password)) {
          case 1:
            return AccountController.registerError(req, res, req.i18n.__('register.error.password.short'))
          case 2:
            return AccountController.registerError(req, res, req.i18n.__('register.error.password.reqs'))
        }

        LabGroups.findOne({where: {id: labGroups}, select: ['id', 'active']}).exec(function (err, lab) {
          if (err) {
            res.serverError(err)
          }
          if (!lab || !lab.active) {
            return AccountController.registerError(req, res, req.i18n.__('register.error.labgroup'))
          }
          Users.create({
            name: name,
            surname: surname,
            album: album,
            email: email,
            password: AccountController.hashPassword(password, st),
            salt: st,
            activated: true,
            labGroups: lab.id
          }).exec(function (err) {
            if (err) {
              if (err.code === 'E_UNIQUE') {
                return AccountController.registerError(req, res, req.i18n.__('register.error.unique'))
              }
              return res.serverError(err)
            }
            return res.redirect(sails.getUrlFor('AccountController.login'))
          })
        })
    }
  },

  userSettings (req, res) {
    switch (req.method) {
      case 'GET':
        LabGroups.find({active: true}).populate('owner').exec(function (err, labs) {
          if (err) {
            return res.serverError(err)
          }

          return res.view('account/settings', {labs: labs})
        })
        break
      case 'POST':
        let action = req.param('action')
        let oldPassword = req.param('oldPass')
        let password = req.param('password')
        let rePassword = req.param('repassword')
        const lab = req.param('lab')
        let confpass = req.param('passlabconf')

        const language = req.param('language')
        let user = req.localUser

        LabGroups.find({active: true}).populate('owner').exec(function (err, labs) {
          if (err) {
            return res.serverError(err)
          }
          // ZMIANA HASŁA
          if (action === 'newPassword') {
            if (user.password === AccountController.hashPassword(oldPassword, user.salt)) {
              if (password !== rePassword) {
                return AccountController.settingsMessage(req, res, req.i18n.__('register.error.repassword'), labs)
              }
              if (password.length < 8) {
                return AccountController.settingsMessage(req, res, req.i18n.__('register.error.password.short'), labs)
              }

              switch (Users.validatePassword(password)) {
                case 1:
                  return AccountController.settingsMessage(req, res, req.i18n.__('register.error.password.short'), labs)
                case 2:
                  return AccountController.settingsMessage(req, res, req.i18n.__('register.error.password.reqs'), labs)
              }
              let passwd = AccountController.hashPassword(password, user.salt)

              Users.update(user.id, {password: passwd}).exec(function (err) {
                if (err) {
                  return res.serverError(err)
                }
                return AccountController.settingsMessage(req, res, req.i18n.__('settings.message.passwordchanged'), labs)
              })
            } else {
              return AccountController.settingsMessage(req, res, req.i18n.__('settings.error.oldpassword'), labs)
            }
          } else if (action === 'newLab') {
            if (req.localUser.isTeacher) {
              return res.badRequest()
            }
            // ZMIANA LAB GRUPY
            if (!labs || labs.length === 0) {
              return res.badRequest()
            }
            let flab = _.find(labs, ['name', lab])
            if (!flab) {
              return res.badRequest()
            }

            if (user.password === AccountController.hashPassword(confpass, user.salt)) {
              if (err) {
                return res.serverError(err)
              }
              StudentsLabGroups.findOne({student: user.id, labgroup: flab.id}).exec((err, slb) => {
                if (err) {
                  return res.serverError(err)
                }
                if (slb) {
                  return AccountController.settingsMessage(req, res, req.i18n.__('settings.error.labgroup.belong'), labs)
                }
                Users.replaceCollection(user.id, 'labGroups').members([flab.id]).exec((err) => {
                  if (err) {
                    return res.serverError(err)
                  }
                  return AccountController.settingsMessage(req, res, req.i18n.__('settings.message.labgroupchanged'), labs)
                })
              })
            } else {
              return AccountController.settingsMessage(req, res, req.i18n.__('settings.error.password'), labs)
            }
          } else if (action === 'languagePreference') {
            if (Object.keys(req.i18n.locales).indexOf(language) > -1) {
              Users.update(user.id, {languagePreference: language}).exec(function (err) {
                if (err) {
                  return res.serverError(err)
                }
                req.setLocale(language)
                req.i18n.locale = language
                return AccountController.settingsMessage(req, res, req.i18n.__('settings.message.languagechanged'), labs)
              })
            } else {
              return AccountController.settingsMessage(req, res, req.i18n.__('settings.message.wronglanguage'), labs)
              // return res.serverError()
            }
          } else {
            return res.serverError()
          }
        })
    }
  }
}
