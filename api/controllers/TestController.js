/**
 * TestController
 *
 * @description :: Server-side logic for managing Tests
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
   * `TestController.index()`
   */
  index: function (req, res) {
    Users.findOneById(3).exec((err, user) => {
      if (err) {
        res.serverError(err)
      }
      return res.json(user.hasRole('student'))
    })
  }
}
