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

  '/': 'AccountController.index',

  // Account

  '/login': 'AccountController.login',
  'GET /logout': 'AccountController.logout',

  '/register': 'AccountController.register',

  '/settings': 'AccountController.userSettings',

  'GET /account': 'AccountController.userSettings',

  // Students

  'GET /topics': 'StudentController.index',

  'GET /topic/:topicid/tasks': 'StudentController.index',
  'GET /ajax/topic/:id/tasks': 'StudentController.tasks',
  'GET /topic/:topicid/task/:taskid': {action: 'student/task', skipAssets: true},
  'POST /topic/:topicid/task/:taskid': {action: 'student/task', skipAssets: true},
  'GET /ajax/checkComments/:task/:lastComment': {action: 'student/ajaxCommentsCheck', skipAssets: true},
  'GET /ajax/reply/:replyid/loadFileContent/:id': {action: 'student/ajaxGetFileContent', skipAssets: true},
  'POST /ajax/removeFile': {action: 'student/ajaxRemoveFile', skipAssets: true},
  'POST /topic/:topicid/task/:taskid/uploadFile': {action: 'student/uploadTaskFiles', skipAssets: true},
  'GET /downloadFile/:fileid': {action: 'student/downloadTaskFile', skipAssets: true},
  'POST /reply/:replyid/updateFile/:fileid': {action: 'student/updateFile', skipAssets: true},
  'GET /topic/:topicid/task/:taskid/sendReply/': {action: 'student/sendReply', skipAssets: true},

  // Teachers
  'GET /teacher': 'TeacherController.index',
  'POST /teacher/markAsRead': 'TeacherController.markAsRead',

  // Teachers // Labgroups
  '/teacher/labgroup': 'teacher/LabsController.listLabGroups',
  '/teacher/labgroup/list': 'teacher/LabsController.listLabGroups',
  '/teacher/labgroup/view/:id': {action: 'teacher/labs/viewLabGroup', skipAssets: true},
  '/teacher/labgroup/view/:id/new': 'teacher/LabsController.viewNewStudentsLabGroup',
  '/teacher/labgroup/edit/:id': {action: 'teacher/labs/editLabGroup', skipAssets: true},
  '/teacher/labgroup/add': 'teacher/LabsController.addLabGroup',

  // Teachers // Replies
  '/teacher/replies': 'teacher/RepliesController.selectTaskReplies',
  '/teacher/replies/view/:taskid': {action: 'teacher/replies/viewTaskReplies', skipAssets: true},
  '/ajax/teacher/replies/view/:taskId/lab/:labId': {action: 'teacher/replies/viewTaskOfLab', skipAssets: true},
  '/ajax/teacher/replies/setTeacherStatus/:replyid': {action: 'teacher/replies/ajaxSetTeacherStatus', skipAssets: true},
  '/ajax/teacher/replies/setStudentDeadline/:taskid': {
    action: 'teacher/replies/ajaxSetStudentTaskDeadline',
    skipAssets: true
  },
  '/ajax/teacher/replies/sendComment/:taskid': {action: 'teacher/replies/ajaxAddComment', skipAssets: true},
  '/ajax/teacher/replies/checkComments/:taskid': {action: 'teacher/replies/ajaxCheckComments', skipAssets: true},

  // Teachers // Topics & Tasks
  '/teacher/topics-and-tasks': {action: 'teacher/topicsandtasks/listTopicsAndTasks', skipAssets: true},
  '/teacher/topics-and-tasks/view/:id': {action: 'teacher/topicsandtasks/taskView', skipAssets: true},
  '/teacher/topics-and-tasks/topic/add': {action: 'teacher/topicsandtasks/addTopic', skipAssets: true},
  '/teacher/topics-and-tasks/topic/:topicId/task/add': {action: 'teacher/topicsandtasks/addTask', skipAssets: true},
  '/teacher/topics-and-tasks/task/edit/:id': {action: 'teacher/topicsandtasks/editTask', skipAssets: true},

  // DEBUG
  '/hw2/enqtest': function (req, res) {
    sails.log.debug(`?idx=${req.param('idx')}&task=${req.param('task')}&sol=${req.param('sol')}&rk=${req.param('rk')}`)
    return res.json({status: 100})
  },

  // API
  '/api/machineTest/': {action: 'api/changeMachineStatus', skipAssets: true}
}
