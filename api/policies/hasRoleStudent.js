/**
 * hasRoleStudent
 *
 * @module      :: Policy
 * @description :: Simple policy to allow only student user
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
  if (req.localUser.hasRole('student')) {
    next()
  } else {
    return res.redirect('/')
  }
}
