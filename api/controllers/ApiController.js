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
   * @req_params {"tid":number, "reply":number<id of student reply>, "status":number<0:ok,1:note,2:warning,3:error>, "passed": boolean<0:repost task to student,1: tests passed>, "raport":string<url>, "message":string<short raport message>, "rk":string<request key>}
   */
  changeMachineStatus: function (req, res) {
    console.log(req.body.username)
    const testId = parseInt(req.param('testId'), '10')
    const replyId = parseInt(req.param('replyId'), '10')
    const status = parseInt(req.param('status'), '10')
    let passed = parseInt(req.param('passed'), '10')
    const raport = req.param('raport')
    const message = req.param('message')
    const rk = req.param('rk')
    if (!_.isInteger(testId) || !_.isInteger(replyId) || !_.isInteger(status) || !_.isInteger(passed)
      || !_.isString(raport) || !_.isString(message) || !_.isString(rk)) {
      return res.badRequest({'error':'E_PARAM_EMPTY'})
    }
    if(status<0 || status> 3){
      return res.badRequest({'error':'E_INVALID_STATUS'})
    }
    passed = !!passed

    let generated_rk = md5(testId.toString() + replyId.toString() + status.toString() + passed.toString() + raport + message + ManageReplies.machine.apiKey)
    if(rk !== generated_rk){
      return res.badRequest({'error':'E_INVALID_REQUEST_KEY'})
    }
    ManageReplies.machine.changeStatus(testId,replyId,status,passed,raport,message,(err)=>{
      if(err){
        switch (err.status){
          case 'E_REPLY_NOT_FOUND':
          case 'E_REPLY_BLOCKED':
          case 'E_REPLY_NOT_SENT':
            return res.badRequest({'error':err.status})
          default:
            sails.log.error(err)
            return res.serverError()
        }
      }
      return res.json({status:100})
    })
  }
}
