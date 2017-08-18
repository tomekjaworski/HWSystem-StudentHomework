/**
 * TeacherController
 *
 * @description :: Server-side logic for managing Teachers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
   * `TeacherController.index()`
   */
  index: function (req, res) {
    return res.view('teacher/index', {title: 'Dashboard :: Teacher Panel', menuItem: 'index'})
  },

  // LabGroups

  listLabGroups: function (req, res) {
    return res.view('teacher/labgroups/list', {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups'})
  }
}
