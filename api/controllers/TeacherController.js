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
    let show = req.param('show')
    let cond = {select: ['id', 'name', 'students', 'owner']}
    if (show !== 'all') {
      cond.owner = req.localUser.id
    }
    LabGroups.find(cond).populate('students').populate('owner')
      .exec((err, groups) => {
        if (err) {
          return res.serverError(err)
        }
        return res.view('teacher/labgroups/list',
          {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', data: groups, show: show})
      })
  },

  viewLabGroup: function (req, res) {
    let id = req.param('id')
    let a = () => LabGroups.findOneById(id).populate('students').exec((err, lab) => {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return res.notFound()
      }
      return res.view('teacher/labgroups/view',
        {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups', data: lab})
    })

    if (req.method === 'POST') {
      let message = req.param('message')
      if (!!message && message !== '') {
        LabGroups.update({id: id}, {message: message}).exec((err, lab) => {
          if (err) return res.serverError(err)
          a()
        })
      } else {
        a()
      }
    } else {
      a()
    }
  },

  addLabGroup: function (req, res) {
    return res.view('teacher/labgroups/add', {title: 'LabGroups :: Teacher Panel', menuItem: 'labgroups'})
  }
}
