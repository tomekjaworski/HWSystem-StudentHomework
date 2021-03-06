/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.http.html
 */

module.exports.http = {

  /****************************************************************************
   *                                                                           *
   * Express middleware to use for every Sails request. To add custom          *
   * middleware to the mix, add a function to the middleware config object and *
   * add its key to the "order" array. The $custom key is reserved for         *
   * backwards-compatibility with Sails v0.9.x apps that use the               *
   * `customMiddleware` config option.                                         *
   *                                                                           *
   ****************************************************************************/

  middleware: {

    /***************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP request. (the Sails *
     * router is invoked by the "router" middleware below.)                     *
     *                                                                          *
     ***************************************************************************/

    order: [
      'www',
      'cookieParser',
      'session',
      'bodyParser',
      'xframe',
      'compress',
      'localsInject',
      'userInject',
      'userNotifs',
      'router',
      'favicon'
    ],

    localsInject: function (req, res, next) {
      req.options = req.options || {}
      req.options.locals = req.options.locals || {}
      req.options.locals.brand = 'HW System'
      next()
    },

    userInject: function (req, res, next) {
      req.options.locals.localUser = req.localUser = null
      if (req.session && req.session.authed) {
        Users.findOne({id: req.session.authed}).exec((err, user) => {
          if (err) {
            req.wantsJSON = true
            return require('../api/responses/serverError').bind({req: req, res: res}, err)()
          }
          if (!user) {
            delete req.session.authed
            return next()
          }
          req.options.locals.localUser = req.localUser = user
          next()
        })
      } else {
        next()
      }
    },

    userNotifs: function (req, res, next) {
      if (req.localUser) {
        if (req.localUser.isTeacher) {
          LabGroups.find({where: {owner: req.localUser.id}, select: ['id']}).exec((err, labs) => {
            if (err) {
              req.wantsJSON = true
              return require('../api/responses/serverError').bind({req: req, res: res}, err)()
            }
            if (labs.length === 0) {
              return next()
            }
            RecentTeacherActions.count({labgroup: labs.map(l => l.id), seen: false}).exec((err, actions) => {
              if (err) {
                req.wantsJSON = true
                return require('../api/responses/serverError').bind({req: req, res: res}, err)()
              }
              req.options.locals.notifs = actions
              return next()
            })
          })
        } else {
          RecentStudentActions.count({student: req.localUser.id, seen: false}).exec((err, actions) => {
            if (err) {
              req.wantsJSON = true
              return require('../api/responses/serverError').bind({req: req, res: res}, err)()
            }
            req.options.locals.notifs = actions
            return next()
          })
        }
      } else {
        return next()
      }
    },

    xframe: require('lusca').xframe('SAMEORIGIN')

    /***************************************************************************
     *                                                                          *
     * The body parser that will handle incoming multipart HTTP requests. By    *
     * default as of v0.10, Sails uses                                          *
     * [skipper](http://github.com/balderdashy/skipper). See                    *
     * http://www.senchalabs.org/connect/multipart.html for other options.      *
     *                                                                          *
     * Note that Sails uses an internal instance of Skipper by default; to      *
     * override it and specify more options, make sure to "npm install skipper" *
     * in your project first.  You can also specify a different body parser or  *
     * a custom function with req, res and next parameters (just like any other *
     * middleware function).                                                    *
     *                                                                          *
     ***************************************************************************/

    // bodyParser: require('skipper')({strict: true})

  }

  /***************************************************************************
   *                                                                          *
   * The number of seconds to cache flat files on disk being served by        *
   * Express static middleware (by default, these files are in `.tmp/public`) *
   *                                                                          *
   * The HTTP static cache is only active in a 'production' environment,      *
   * since that's the only time Express will cache flat-files.                *
   *                                                                          *
   ***************************************************************************/

  // cache: 31557600000
}
