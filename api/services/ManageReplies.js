const ManageReplies = module.exports = {
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
                  let msg = (teacherName ? 'Prowadzący '+teacherName : 'System') + ' odblokował zadanie w celu jego edycji i ponownego przesłania'
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
      [taskId, studentId]).exec((err, result)=>{
      if (err) {
        return cb(err)
      }
      if (result.rows.length===0) {
        return cb(null,null)
      }
      return cb(null, result.rows[0].deadline)
    })
  }
}