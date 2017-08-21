/**
 * isLoggedIn
 *
 * @module      :: Policy
 * @description :: Simple policy to allow only teacher userw
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
  if (req.localUser.hasRole('teacher')) {
    next()
  } else {
    return res.forbidden()
  }
}
