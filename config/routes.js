/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
   * etc. depending on your default view engine) your home page.              *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  '/': {
    view: 'homepage'
  },

  // Account

  '/login': 'AccountController.login',
  'GET /logout': 'AccountController.logout',

  '/register': 'AccountController.register',

  '/settings': 'AccountController.userSettings',

  'GET /account': 'AccountController.index',

  'GET /topic/:topicid/tasks': 'AccountController.index',
  'GET /ajax/topic/:id/tasks': 'AccountController.tasks',
  'GET /topic/:topicid/task/:taskid': {action: 'account/task', skipAssets: true},
  'POST /topic/:topicid/task/:taskid': {action: 'account/task', skipAssets: true},

  // Teachers
  '/teacher': 'TeacherController.index',
  '/teacher/labgroup': 'TeacherController.listLabGroups',
  '/teacher/labgroup/list': 'TeacherController.listLabGroups',
  '/teacher/labgroup/view/:id': {action: 'teacher/viewLabGroup', skipAssets: true},
  '/teacher/labgroup/view/:id/new': 'TeacherController.viewNewStudentsLabGroup',
  '/teacher/labgroup/edit/:id': {action: 'teacher/editLabGroup', skipAssets: true},
  '/teacher/labgroup/add': 'TeacherController.addLabGroup'

}
