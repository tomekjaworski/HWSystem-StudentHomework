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
    LabGroups.find({owner: req.localUser.id, select: ['id', 'name']}).exec((err, groups) => {
      if (err) return res.serverError(err)
      return res.view('teacher/labgroups/list', {
        title: 'LabGroups :: Teacher Panel',
        menuItem: 'labgroups',
        data: groups
      })
    })
  },

  viewLabGroup: function (req, res) {
    return res.view('teacher/labgroups/view', {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups'})
  },

  addLabGroup: function (req, res) {
    return res.view('teacher/labgroups/add', {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups'})
  }
}
