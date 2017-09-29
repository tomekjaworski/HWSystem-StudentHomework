/**
 * ApiController
 *
 * @description :: Api for other services to message hw system
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const md5 = require('md5');

// eslint-disable-next-line no-unused-vars
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
   * @req_params {"tid":number, "reply":number<id of student reply>, "status":number<0:ok,1:note,2:warning,3:error>, "passed": boolean<false:repost task to student,true: tests passed>, "raport":string<url>, "message":string<short raport message>, "rk":string<request key>}
   */
  changeMachineStatus: function (req, res) {
    if(!req.is('json')){
      return res.badRequest('Only support json data')
    }
    let data = req.body
    if (!_.isInteger(data.tid) || !_.isInteger(data.reply) || !_.isInteger(data.status) || !_.isBoolean(data.passed)
      || !_.isString(data.raport) || !_.isString(data.message) || !_.isString(data.rk)) {
      return res.badRequest({'error':'E_PARAM_EMPTY'})
    }
    if(data.status<0 || data.status> 3){
      return res.badRequest({'error':'E_INVALID_STATUS'})
    }

    let generated_rk = md5(data.tid.toString() + data.reply.toString() + data.status.toString() + data.passed.toString() + data.raport + data.message + ManageReplies.machine.apiKey)
    if(data.rk !== generated_rk){
      return res.badRequest({'error':'E_INVALID_REQUEST_KEY'})
    }
    ManageReplies.machine.changeStatus(data.tid,data.reply,data.status,data.passed,data.raport,data.message,(err)=>{
      if(err){
        switch (err.code){
          case 'E_REPLY_NOT_FOUND':
          case 'E_REPLY_BLOCKED':
          case 'E_REPLY_NOT_SENT':
          case 'E_REPLY_OLD':
            return res.badRequest({'error':err.code})
          default:
            sails.log.error(err)
            return res.serverError()
        }
      }
      return res.json({status:100})
    })
  }
}
