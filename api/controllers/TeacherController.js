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
    LabGroups.find({owner:req.localUser.id}).exec((err,labs)=>{
      if(err) return res.serverError(err)
      if(labs.length===0){
        return res.view('teacher/index', {title: 'Dashboard :: Teacher Panel', menuItem: 'index'})
      }
      RecentTeacherActions.find({labgroup:labs.map(l=>l.id),seen:false}).sort('updatedAt DESC').exec((err,actions)=>{
        if(err) return res.serverError(err)
        _.forEach(actions, (a)=>{
          a.updatedAt = dateFormat(a.updatedAt, 'HH:MM dd/mm/yyyy')
        })
        return res.view('teacher/index', {title: 'Dashboard :: Teacher Panel', menuItem: 'index', actions:actions})
      })
    })
  },
  markAsRead: function (req, res) {
    let actions = req.param('actions')
    if(!actions || !actions.length===0){
      return res.redirect('/teacher')
    }
    RecentTeacherActions.update({id:actions}, {seen: true}).exec((err) => {
      if (err) return res.serverError(err)
      return res.redirect('/teacher')
    })
  }
}
