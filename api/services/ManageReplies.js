const request = require('request')
const md5 = require('md5');

const ManageReplies = module.exports = {

  machine: {
    ip: 'http://localhost',
    port: 1337,
    apiKey: 'alamakota1234',

    sendUpdate: function (studentId, taskId, replyId, cb) {
      let rk = md5(studentId.toString() + taskId.toString() + replyId.toString() + this.apiKey)
      request(`${this.ip}:${this.port}/hw2/enqtest?idx=${studentId}&task=${taskId}&sol=${replyId}&rk=${rk}`, function (error, response, body) {
        if (error) {
          return cb(error)
        }
        if (!response || response.statusCode !== 200) {
          let err = new Error()
          err.code = 'E_RESPONSE_NOT_OK'
          err.resposne = response
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
        }
        else if (data.status === 101) {
          let err = new Error()
          err.code = 'E_MACHINE_REJECTED'
          err.data = data
          return cb(err)
        }
        else {
          let err = new Error()
          err.code = 'E_UNKNOWN_ERROR'
          err.data = data
          return cb(err)
        }
      });
    },

    changeStatus: function (testId, replyId, status, passed, raport, message, cb) {
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
        if (!reply.lastSent || !reply.newest) {
          let err = new Error()
          err.code = 'E_REPLY_NOT_SENT'
          return cb(err)
        }
        status += 2
        TaskReplies.update(replyId, {
          machineStatus: status,
          machineTestid: testId,
          machineOk: passed,
          machineRaport: raport,
          machineMessage: message
        }).exec((err) => {
          TaskReplies.findOne(replyId).exec((err, reply) => {
            if (err) {
              return cb(err)
            }
            let msg
            switch(status){
              case 2:
                msg = 'Twoje rozwiązanie przeszło testy maszynowe poprawnie'+(passed ? ' i testy zostały zaliczone.' : ' ale testy nie zostały zaliczone! Sprawdź raport testów.')
                break
              case 3:
                msg = 'Twoje rozwiązanie przeszło testy maszynowe poprawnie z pewnymi dodatkowymi notatkami'+(passed ? ' i testy zostały zaliczone. Możesz sprawdzić notatki w raporcie z testu.' : ' ale testy nie zostały zaliczone! Sprawdź raport testów.')
                break
              case 4:
                msg = 'Twoje rozwiązanie przeszło testy maszynowe jednak są ważne uwagi'+(passed ? ' mimo to testy zostały zaliczone. Możesz sprawdzić uwagi w raporcie z testu.' : ' i testy nie zostały zaliczone! Sprawdź raport testów.')
                break
              case 5:
                msg = 'Twoje rozwiązanie nie przeszło testów maszynowych'+(passed ? ' ale mimo to testy zostały zaliczone. Zalecane jest sprawdzenie raportu z testów.' : ' i testy nie zostały zaliczone! Sprawdź raport testów.')
                break
            }
            TaskComments.create({
              taskStudent: reply.student,
              task: reply.task,
              user: null,
              comment: msg,
              viewed: false
            }).exec((err) => {
              if (err) {
                return res.serverError(err)
              }
              if(passed){
                return cb(null)
              }
              else {
                ManageReplies.repostTask(reply.student, reply.task, null, (err)=>{
                  if(err){
                    return cb(err)
                  }
                  return cb(null)
                })
              }
            })
          })
        })
      })
    }
  },

  repostTask: function (studentId, taskId, teacherName, cb) {
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
                err.code = 'E_REPLY_NOT_CREATED'
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
                  let msg = (teacherName ? 'Prowadzący ' + teacherName : 'System') + ' odblokował zadanie w celu jego edycji i ponownego przesłania'
                  TaskComments.create({
                    taskStudent: studentId,
                    task: taskId,
                    user: null,
                    comment: msg,
                    viewed: false
                  }).exec((err) => {
                    if (err) {
                      return res.serverError(err)
                    }
                    cb(null)
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