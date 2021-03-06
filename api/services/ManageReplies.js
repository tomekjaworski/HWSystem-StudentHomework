const request = require('request')
const md5 = require('md5')

const ManageReplies = module.exports = {

  machine: {
    ip: sails.config.settings.machine.ip,
    port: sails.config.settings.machine.port,
    apiKey: sails.config.settings.machine.apiKey,
    updateTimeout: function (studentId, taskId, replyId, time = 10) {
      setTimeout(function () {
        sails.log.verbose('Executing timeouted machine test API request')
        TaskReplies.findOne(replyId).exec((err, task) => {
          if (err) {
            sails.log.error('Error getting reply from db')
            return sails.log(err)
          }
          if (!task) {
            return sails.log.error('Error getting reply from db')
          }
          if (task.machineStatus !== 0) {
            return
          }
          ManageReplies.machine.sendUpdate(studentId, taskId, replyId, (err) => {
            if (err) {
              sails.log.error('Remote machine test API returned error')
              sails.log.error(`ERROR CODE: ${err.code}`)
              sails.log.error(err.data)
              sails.log.error('Scheduling task repeat in 5 minutes from now')
              ManageReplies.machine.updateTimeout(studentId, taskId, replyId, 5 * 60)
            }
          })
        })
      }, time * 1000)
    },

    sendUpdate: function (studentId, taskId, replyId, cb) {
      let rk = md5(studentId.toString() + taskId.toString() + replyId.toString() + this.apiKey)
      request(`${this.ip}:${this.port}/hw2/enqtest?idx=${studentId}&task=${taskId}&sol=${replyId}&rk=${rk}`, function (error, response, body) {
        if (error) {
          return cb(error)
        }
        if (!response || response.statusCode !== 200) {
          let err = new Error()
          err.code = 'E_RESPONSE_NOT_OK'
          err.data = response
          return cb(err)
        }
        let data = JSON.parse(body)
        if (data.status === 100) {
          TaskReplies.update(replyId, {machineStatus: 1}).exec((err) => {
            if (err) {
              return cb(err)
            }
            return cb()
          })
        } else if (data.status === 101) {
          let err = new Error()
          err.code = 'E_MACHINE_REJECTED'
          err.data = data
          return cb(err)
        } else {
          let err = new Error()
          err.code = 'E_UNKNOWN_ERROR'
          err.data = data
          return cb(err)
        }
      })
    },

    changeStatus: function (testId, replyId, status, passed, report, message, cb) {
      TaskReplies.findOne(replyId).exec((err, reply) => {
        if (err) {
          return cb(err)
        }
        if (!reply) {
          let err = new Error()
          err.code = 'E_REPLY_NOT_FOUND'
          return cb(err)
        }
        if (reply.blocked) {
          let err = new Error()
          err.code = 'E_REPLY_BLOCKED'
          return cb(err)
        }
        if ((reply.sent && !reply.lastSent) || (reply.sent && reply.lastSent && !reply.newest)) {
          let err = new Error()
          err.code = 'E_REPLY_OLD'
          return cb(err)
        }
        if (!reply.lastSent && reply.newest) {
          let err = new Error()
          err.code = 'E_REPLY_NOT_SENT'
          return cb(err)
        }
        status += 2
        TaskReplies.update(replyId, {
          machineStatus: status,
          machineTestId: testId,
          machineOk: passed,
          machineReport: report,
          machineMessage: message
        }).exec((err) => {
          if (err) {
            return cb(err)
          }
          TaskReplies.findOne(replyId).exec((err, reply) => {
            if (err) {
              return cb(err)
            }
            let msg
            // todo: przebudowac to zeby bylo mozna przetlumaczyc w layoucie
            switch (status) {
              case 2:
                msg = 'Twoje rozwi??zanie przesz??o testy maszynowe' + (passed ? ' i testy zosta??y zaliczone.' : ' ale testy nie zosta??y zaliczone! Sprawd?? raport test??w.')
                break
              case 3:
                msg = 'Podczas test??w maszynowych pojawi??y si?? pewne notatki' + (passed ? ' ale testy zosta??y zaliczone. Mo??esz sprawdzi?? notatki w raporcie z testu.' : ' i testy nie zosta??y zaliczone! Sprawd?? raport test??w.')
                break
              case 4:
                msg = 'W Twoim rozwi??zaniu wyst??puj?? wa??ne uwagi' + (passed ? ' mimo to testy zosta??y zaliczone. Mo??esz sprawdzi?? uwagi w raporcie z testu.' : ' i testy nie zosta??y zaliczone! Sprawd?? raport test??w.')
                break
              case 5:
                msg = 'W Twoim rozwi??zaniu wyst??puj?? powa??ne b????dy' + (passed ? ' ale mimo to testy zosta??y zaliczone. Zalecane jest sprawdzenie raportu z test??w.' : ' i testy nie zosta??y zaliczone! Sprawd?? raport test??w.')
                break
            }
            msg += ` Raport z test??w: ${reply.machineMessage}. Pe??na wersja: ${reply.machineReport}`
            TaskComments.create({
              taskStudent: reply.student,
              task: reply.task,
              user: null,
              comment: msg,
              viewed: false
            }).exec((err) => {
              if (err) {
                return cb(err)
              }
              RecentAction.changeMachineStatus(reply.student, reply.task, (err) => {
                if (err) {
                  return cb(err)
                }
                if (passed) {
                  return cb(null)
                } else {
                  ManageReplies.repostTask(reply.student, reply.task, null, (err) => {
                    if (err) {
                      return cb(err)
                    }
                    return cb(null)
                  })
                }
              })
            })
          })
        })
      })
    }
  },

  repostTask: function (studentId, taskId, teacher, cb) {
    Users.findOne(studentId).populate('labGroups').exec((err, student) => {
      if (err) {
        return cb(err)
      }
      if (!student) {
        let err = new Error()
        err.code = 'E_USER_NOT_FOUND'
        return cb(err)
      }
      Tasks.findOne(taskId).exec((err, task) => {
        if (err) {
          return cb(err)
        }
        if (!task) {
          let err = new Error()
          err.code = 'E_TASK_NOT_FOUND'
          return cb(err)
        }
        TaskReplies.findOne({task: taskId, student: studentId, lastSent: true, newest: true}).exec((err, reply) => {
          if (err) {
            return cb(err)
          }
          if (!reply) {
            let err = new Error()
            err.code = 'E_REPLY_NOT_FOUND'
            return cb(err)
          }
          if (reply.blocked) {
            let err = new Error()
            err.code = 'E_REPLY_BLOCKED'
            return cb(err)
          }
          reply.lastSent = false
          reply.firstId = reply.firstId === 0 ? reply.id : reply.firstId
          reply.newest = true
          reply.count++
          let lastId = reply.id
          delete reply.id
          delete reply.createdAt
          delete reply.updatedAt
          TaskReplies.update(lastId, {newest: false}).exec((err) => {
            if (err) {
              return cb(err)
            }
            TaskReplies.create(_.toPlainObject(reply)).meta({fetch: true}).exec((err, reply) => {
              if (err) {
                return cb(err)
              }
              if (!reply) {
                let err = new Error()
                err.code = 'E_REPLY_NOT_FOUND'
                return cb(err)
              }
              TaskReplyFiles.find({reply: lastId}).exec((err, files) => {
                if (err) {
                  return cb(err)
                }
                if (!files || files.length === 0) {
                  let err = new Error()
                  err.code = 'E_FILES_NOT_FOUND'
                  return cb(err)
                }
                for (let id in files) {
                  let file = files[id]
                  delete file.id
                  delete file.createdAt
                  delete file.updatedAt
                  file.reply = reply.id
                  files[id] = _.toPlainObject(file)
                }
                TaskReplyFiles.createEach(files).meta({fetch: true}).exec((err, files) => {
                  if (err) {
                    return cb(err)
                  }
                  if (!files || files.length === 0) {
                    let err = new Error()
                    err.code = 'E_FILES_NOT_CREATED'
                    return cb(err)
                  }
                  // todo: przebudowac to zeby bylo mozna przetlumaczyc w layoucie
                  let msg = (typeof teacher === 'object' ? 'Prowadz??cy ' + teacher.fullName() : 'System') + ' odblokowa?? zadanie w celu jego edycji i ponownego przes??ania'
                  TaskComments.create({
                    taskStudent: studentId,
                    task: taskId,
                    user: null,
                    comment: msg,
                    viewed: false
                  }).exec((err) => {
                    if (err) {
                      return cb(err)
                    }
                    RecentAction.repostTask(studentId, taskId, (typeof teacher === 'object' ? teacher.id : null), (err) => {
                      if (err) {
                        return cb(err)
                      }
                      return cb(null)
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  },

  getStudentDeadline: function (taskId, studentId, cb) {
    return sails.sendNativeQuery(`SELECT
(case when scdl.task IS NOT NULL then scdl.deadline else
 (case when lbtd.deadline IS NOT NULL then lbtd.deadline else topic.deadline end) end) deadline
FROM studentslabgroups slb
LEFT JOIN tasks task ON task.id = $1
LEFT JOIN topics topic ON task.topic = topic.id
LEFT JOIN labgrouptopicdeadline lbtd ON lbtd.group = slb.labgroup AND lbtd.topic = task.topic
LEFT JOIN studentcustomdeadlines scdl ON scdl.student = slb.student AND scdl.task = task.id
WHERE slb.active=1 AND slb.student = $2`,
      [taskId, studentId]).exec((err, result) => {
        if (err) {
          return cb(err)
        }
        if (result.rows.length === 0) {
          return cb(null, null)
        }
        return cb(null, result.rows[0].deadline)
      })
  }
}
