/* eslint-disable no-unused-vars */
const RecentAction = module.exports = {
  generator: {
    studentComment: function (studentId, taskId, labgroupId, cb) {
      Users.findOne(studentId).exec((err, student) => {
        if (err) {
          return cb(err)
        }
        LabGroups.findOne(labgroupId).exec((err, labgroup) => {
          if (err) {
            return cb(err)
          }
          Tasks.findOne(taskId).populate('topic').exec((err, task) => {
            if (err) {
              return cb(err)
            }
            let topicTitle = task.topic.title.substr(0, 20)
            if (task.topic.title.length > 20) {
              topicTitle += '[...]'
            }
            let taskTitle = task.title.substr(0, 20)
            if (task.title.length > 20) {
              taskTitle += '[...]'
            }
            // todo: przebudowac to zeby bylo mozna przetlumaczyc w layoucie
            cb(null, `Student ${student.fullName()} napisał komentarz do zadania <a href='/teacher/replies/view/${task.id}'>[${task.topic.number}. ${topicTitle}/${task.number}. ${taskTitle}]</a> w grupie laboratoryjnej ${labgroup.name}`)
          })
        })
      })
    },
    taskReply: function (studentId, taskId, labgroupId, again, cb) {
      Users.findOne(studentId).exec((err, student) => {
        if (err) {
          return cb(err)
        }
        LabGroups.findOne(labgroupId).exec((err, labgroup) => {
          if (err) {
            return cb(err)
          }
          Tasks.findOne(taskId).populate('topic').exec((err, task) => {
            if (err) {
              return cb(err)
            }
            let topicTitle = task.topic.title.substr(0, 20)
            if (task.topic.title.length > 20) {
              topicTitle += '[...]'
            }
            let taskTitle = task.title.substr(0, 20)
            if (task.title.length > 20) {
              taskTitle += '[...]'
            }
            cb(null, `Student ${student.fullName()} wysłał ${(again ? '<u>KOLEJNĄ</u> ' : '')}odpowiedź do zadania <a href='/teacher/replies/view/${task.id}'>[${task.topic.number}. ${topicTitle}/${task.number}. ${taskTitle}]</a> w grupie laboratoryjnej ${labgroup.name}`)
          })
        })
      })
    }
  },

  sendTaskReply: function (studentId, taskId, labgroupId, again, cb) {
    RecentTeacherActions.findOrCreate({
      student: studentId,
      labgroup: labgroupId,
      task: taskId,
      seen: false,
      type: 2
    }, {student: studentId, labgroup: labgroupId, task: taskId, type: 2})
      .exec((err, action, created) => {
        if (err) {
          return cb(err)
        }
        this.generator.taskReply(studentId, taskId, labgroupId, again, (err, msg) => {
          if (err) {
            return cb(err)
          }
          RecentTeacherActions.update(action.id, {message: msg}).exec((err) => {
            if (err) {
              return cb(err)
            }
            return cb(null)
          })
        })
      })
  },

  addStudentComment: function (studentId, taskId, labgroupId, cb) {
    RecentTeacherActions.findOrCreate({
      student: studentId,
      labgroup: labgroupId,
      task: taskId,
      seen: false,
      type: 1
    }, {student: studentId, labgroup: labgroupId, task: taskId, type: 1})
      .exec((err, action, created) => {
        if (err) {
          return cb(err)
        }
        if (created) {
          this.generator.studentComment(studentId, taskId, labgroupId, (err, msg) => {
            if (err) {
              return cb(err)
            }
            RecentTeacherActions.update(action.id, {message: msg}).exec((err) => {
              if (err) {
                return cb(err)
              }
              return cb(null)
            })
          })
        } else {
          RecentTeacherActions.update(action.id, {updatedAt: Date.now()}).exec((err) => {
            if (err) {
              return cb(err)
            }
            return cb(null)
          })
        }
      })
  }
}
