/**
 * TeacherController
 *
 * @description :: Server-side logic for managing Teachers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const dateFormat = require('dateformat')
// eslint-disable-next-line no-unused-vars
const TeacherController = module.exports = {

  /**
   * `TeacherController.index()`
   */
  index: function (req, res) {
    let m = parseInt(req.param('m'), '10')
    let show = req.param('show') === 'all'
    let param = {}
    if (_.isInteger(m)) {
      param.type = m
    }
    LabGroups.find({where: {owner: req.localUser.id}, select: ['id']}).exec((err, labs) => {
      if (err) {
        return res.serverError(err)
      }
      if (labs.length === 0) {
        return res.view('teacher/index', {title: req.i18n.__('teacher.dashboard.title'), menuItem: 'index'})
      }
      if (!show) {
        param.labgroup = labs.map(l => l.id)
      }
      RecentTeacherActions.find(_.merge({
        seen: false
      }, param)).sort('updatedAt DESC').exec((err, actions) => {
        if (err) {
          return res.serverError(err)
        }
        _.forEach(actions, (a) => {
          try {
            a.updatedAt = dateFormat(a.updatedAt, 'HH:MM dd/mm/yyyy')
          } catch (err) {
            return res.serverError(err)
          }
        })
        return res.view('teacher/index', {
          title: req.i18n.__('teacher.dashboard.title'),
          menuItem: 'index',
          actions: actions
        })
      })
    })
  },

  markAsRead: function (req, res) {
    let actions = req.param('actions')
    if (!actions || !actions.length === 0) {
      return res.redirect('/teacher')
    }
    LabGroups.find({where: {owner: req.localUser.id}, select: ['id']}).exec((err, labs) => {
      if (err) {
        return res.serverError(err)
      }
      if (labs.length === 0) {
        return res.redirect('/teacher')
      }
      RecentTeacherActions.update({id: actions, labgroup: labs.map(l => l.id)}, {seen: true}).exec((err) => {
        if (err) {
          return res.serverError(err)
        }
        return res.redirect('/teacher')
      })
    })
  }
}
