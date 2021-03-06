/* eslint-disable no-unused-vars */
/**
 * ApiController
 *
 * @description :: Api for other services to message hw system
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const md5 = require('md5')

const ApiController = module.exports = {

  /**
   * `ApiController.index()`
   */
  index: function (req, res) {
    return res.json({})
  },
  /**
   * @param req
   * @param res
   * @req_params {"tid":number, "reply":number<id of student reply>, "status":number<0:ok,1:note,2:warning,3:error>, "passed": boolean<false:repost task to student,true: tests passed>, "report":string<url>, "message":string<short report message>, "rk":string<request key>}
   */
  changeMachineStatus: function (req, res) {
    if (!req.is('json')) {
      return res.status(400).send('Only support json data')
    }
    let data = req.body
    if (!_.isInteger(data.tid) || !_.isInteger(data.reply) || !_.isInteger(data.status) || !_.isBoolean(data.passed) ||
      !_.isString(data.report) || !_.isString(data.message) || !_.isString(data.rk)) {
      return res.status(400).json({'error': 'E_PARAM_EMPTY'})
    }
    if (data.status < 0 || data.status > 3) {
      return res.status(400).json({'error': 'E_INVALID_STATUS'})
    }

    let generatedRk = md5(data.tid.toString() + data.reply.toString() + data.status.toString() + data.passed.toString() + data.report + data.message + ManageReplies.machine.apiKey)
    if (data.rk !== generatedRk) {
      return res.status(400).json({'error': 'E_INVALID_REQUEST_KEY'})
    }
    ManageReplies.machine.changeStatus(data.tid, data.reply, data.status, data.passed, data.report, data.message, (err) => {
      if (err) {
        switch (err.code) {
          case 'E_REPLY_NOT_FOUND':
          case 'E_REPLY_BLOCKED':
          case 'E_REPLY_NOT_SENT':
          case 'E_REPLY_OLD':
            return res.status(400).json({'error': err.code})
          default:
            sails.log.error(err)
            return res.serverError()
        }
      }
      return res.json({status: 100})
    })
  }
}
