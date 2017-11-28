/* eslint-disable no-unused-vars,indent */
/**
 * RepliesController
 *
 * @description :: Server-side logic for managing Replies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const pdc = require('pdc')
const bytes = require('bytes')
const dateFormat = require('dateformat')

const RepliesController = module.exports = {
  selectTaskReplies: function (req, res) {
    Topics.find().populate('tasks').exec((err, topics) => {
      if (err) {
        return res.serverError(err)
      }
      return res.view('teacher/replies/index',
        {title: req.i18n.__('teacher.replies.teacherpanel'), menuItem: 'replies', data: topics})
    })
  },

  viewTaskReplies: function (req, res) {
    let id = req.param('taskid')
    Tasks.findOne(id).populate('topic').exec((err, task) => {
      if (err) {
        return res.serverError(err)
      }
      if (!task) {
        return res.notFound()
      }
      LabGroups.find({select: ['name', 'id', 'owner']}).populate('owner').exec((err, labs) => {
        if (err) {
          return res.serverError(err)
        }
        if (!labs) {
          return res.serverError(req.i18n.__('teacher.replies.nolabgroups'))
        }
        task.labs = labs
        sails.sendNativeQuery(`SELECT (SELECT \`id\` FROM \`tasks\` WHERE \`tasks\`.\`topic\` < $1 ORDER BY \`topic\` DESC, CAST(\`number\` AS UNSIGNED) DESC LIMIT 1) \`prevTopicTask\`, 
(SELECT \`id\` FROM \`tasks\` WHERE \`tasks\`.\`topic\` > $1 ORDER BY \`topic\` ASC, CAST(\`number\` AS UNSIGNED) ASC LIMIT 1) \`nextTopicTask\`, 
(SELECT \`id\` FROM \`tasks\` WHERE \`tasks\`.\`topic\` = $1 AND \`tasks\`.number < $2 ORDER BY CAST(\`number\` AS UNSIGNED) DESC LIMIT 1) \`prevTask\`,
(SELECT \`id\` FROM \`tasks\` WHERE \`tasks\`.\`topic\` = $1 AND \`tasks\`.number > $2 ORDER BY CAST(\`number\` AS UNSIGNED) ASC LIMIT 1) \`nextTask\``, [task.topic.id, task.number]).exec((err, nextPrev) => {
          if (err) {
            return res.serverError(err)
          }
          return res.view('teacher/replies/view',
            {
              title: req.i18n.__('teacher.replies.teacherpanel'),
              menuItem: 'replies',
              data: task,
              breadcrumb: 'view',
              nextPrev: nextPrev.rows[0]
            })
        })
      })
    })
  },

  viewOneReply: function (req, res) {
    let replyId = parseInt(req.param('replyId'), '10')
    if (!_.isInteger(replyId)) {
      return res.notFound()
    }
    TaskReplies.findOne(replyId).populate('task').populate('student').exec((err,reply)=>{
      if (err) {
        return res.serverError(err)
      }
      if (!reply) {
        return res.notFound()
      }
      StudentsLabGroups.findOne({student: reply.student.id}).populate('labgroup').exec((err,lab)=>{
        if (err) {
          return res.serverError(err)
        }
        if (!lab) {
          return res.notFound()
        }
        let student = reply.student
        student.reply = reply
        sails.sendNativeQuery(`SELECT slb.student,
(case when scdl.task IS NOT NULL then scdl.deadline else
 (case when lbtd.deadline IS NOT NULL then lbtd.deadline else topic.deadline end) end) deadline
FROM studentslabgroups slb
LEFT JOIN tasks task ON task.id = $1
LEFT JOIN topics topic ON task.topic = topic.id
LEFT JOIN labgrouptopicdeadline lbtd ON lbtd.group = slb.labgroup AND lbtd.topic = task.topic
LEFT JOIN studentcustomdeadlines scdl ON scdl.student = slb.student AND scdl.task = task.id
WHERE slb.student =$2 AND slb.active=1`, [reply.task.id, student.id]).exec((err, result) => {
          if (err) {
            return res.serverError(err)
          }
          let deadline = result.rows[0]
          try {
            student.deadline = dateFormat(deadline.deadline, 'yyyy-mm-dd')
          } catch (err) {
            return res.serverError(err)
          }
          TaskComments.find({
            task: reply.task.id,
            taskStudent: student.id,
            user: {'!=': null}
          }).populate('user').exec((err, comments) => {
            if (err) {
              return res.serverError(err)
            }
            if (comments && comments.length && comments.length > 0) {
              _.forEach(comments, (c) => {
                try {
                  c.createdAt = dateFormat(c.createdAt, 'dd/mm/yyyy')
                } catch (err) {
                  return res.serverError(err)
                }
              })
              student.comments = comments
            }
            MySqlFile().readManyByReply(reply.id, (err, files) => {
              if (err) {
                return res.serverError(err)
              }

              let promises = files.map(function (file) {
                return new Promise(function (resolve, reject) {
                  file.fileSize = bytes(file.fileSize, {unitSeparator: ' '})
                  if (file.fileMimeType.includes('text/')) {
                    let type = ''
                    if (['h', 'c'].includes(file.fileExt)) {
                      type = 'c'
                    } else if (['hpp', 'cpp'].includes(file.fileExt)) {
                      type = 'c++'
                    } else {
                      return resolve(file)
                    }
                    if (file.file.err) {
                      return resolve(file)
                    }
                    let content = '```' + type + '\n' + file.file + '\n```'
                    pdc(content, 'markdown_github-raw_html', 'html5', function (err, result) {
                      if (err) {
                        return reject(err)
                      }
                      file.file = result
                      return resolve(file)
                    })
                  } else {
                    return resolve(file)
                  }
                })
              })

              Promise.all(promises).then((files) => {
                student.reply.files = files
                return res.view('teacher/replies/viewOneReply',
                  {
                    lab: lab.labgroup,
                    task: reply.task,
                    student: student
                  })
              })
            })
          })
        })
      })
    })
  },

  viewOneLatestReply: function (req, res) {
    let taskId = parseInt(req.param('taskId'), '10')
    let studentId = parseInt(req.param('studentId'), '10')
    if (!_.isInteger(taskId) || !_.isInteger(studentId)) {
      return res.notFound()
    }
    Tasks.findOne(taskId).exec((err, task) => {
      if (err) {
        return res.serverError(err)
      }
      if (!task) {
        return res.notFound()
      }
      StudentsLabGroups.findOne({student: studentId}).populate('student').populate('labgroup').exec((err, lab) => {
        if (err) {
          return res.serverError(err)
        }
        if (!lab) {
          return res.notFound()
        }
        let student = lab.student
        sails.sendNativeQuery(`SELECT slb.student,
(case when scdl.task IS NOT NULL then scdl.deadline else
 (case when lbtd.deadline IS NOT NULL then lbtd.deadline else topic.deadline end) end) deadline
FROM studentslabgroups slb
LEFT JOIN tasks task ON task.id = $1
LEFT JOIN topics topic ON task.topic = topic.id
LEFT JOIN labgrouptopicdeadline lbtd ON lbtd.group = slb.labgroup AND lbtd.topic = task.topic
LEFT JOIN studentcustomdeadlines scdl ON scdl.student = slb.student AND scdl.task = task.id
WHERE slb.student =$2 AND slb.active=1`, [task.id, student.id]).exec((err, result) => {
          if (err) {
            return res.serverError(err)
          }
          let deadline = result.rows[0]
          try {
            student.deadline = dateFormat(deadline.deadline, 'yyyy-mm-dd')
          } catch (err) {
            return res.serverError(err)
          }
          TaskComments.find({
            task: task.id,
            taskStudent: student.id,
            user: {'!=': null}
          }).populate('user').exec((err, comments) => {
            if (err) {
              return res.serverError(err)
            }
            if (comments && comments.length && comments.length > 0) {
              _.forEach(comments, (c) => {
                try {
                  c.createdAt = dateFormat(c.createdAt, 'dd/mm/yyyy')
                } catch (err) {
                  return res.serverError(err)
                }
              })
              student.comments = comments
            }
            TaskReplies.findOne({
              task: task.id,
              student: student.id,
              lastSent: true
            }).populate('files').exec((err, reply) => {
              if (err) {
                return res.serverError(err)
              }

              if (!reply) {
                return res.view('teacher/replies/viewOne',
                  {
                    lab: lab.labgroup,
                    task: task,
                    student: student
                  })
              } else {
                MySqlFile().readManyByReply(reply.id, (err, files) => {
                  if (err) {
                    return res.serverError(err)
                  }

                  let promises = files.map(function (file) {
                    return new Promise(function (resolve, reject) {
                      file.fileSize = bytes(file.fileSize, {unitSeparator: ' '})
                      if (file.fileMimeType.includes('text/')) {
                        let type = ''
                        if (['h', 'c'].includes(file.fileExt)) {
                          type = 'c'
                        } else if (['hpp', 'cpp'].includes(file.fileExt)) {
                          type = 'c++'
                        } else {
                          return resolve(file)
                        }
                        if (file.file.err) {
                          return resolve(file)
                        }
                        let content = '```' + type + '\n' + file.file + '\n```'
                        pdc(content, 'markdown_github-raw_html', 'html5', function (err, result) {
                          if (err) {
                            return reject(err)
                          }
                          file.file = result
                          return resolve(file)
                        })
                      } else {
                        return resolve(file)
                      }
                    })
                  })

                  Promise.all(promises).then((files) => {
                    student.reply = reply
                    student.reply.files = files
                    return res.view('teacher/replies/viewOne',
                      {
                        lab: lab.labgroup,
                        task: task,
                        student: student
                      })
                  })
                })
              }
            })
          })
        })
      })
    })
  },

  viewTaskOfLab: function (req, res) {
    let taskId = parseInt(req.param('taskId'), '10')
    let labId = parseInt(req.param('labId'), '10')
    if (!_.isInteger(taskId) || !_.isInteger(labId)) {
      return res.notFound()
    }
    Tasks.findOne(taskId).exec((err, task) => {
      if (err) {
        return res.serverError(err)
      }
      if (!task) {
        return res.notFound()
      }
      LabGroups.findOne(labId).exec((err, labgrp) => {
        if (err) {
          return res.serverError(err)
        }
        if (!labgrp) {
          return res.notFound()
        }
        StudentsLabGroups.find({labgroup: labId, active: true}).populate('student').exec((err, lab) => {
          if (err) {
            return res.serverError(err)
          }
          if (!lab || !lab.length || lab.length === 0) {
            return res.view('teacher/replies/labTasksPartial',
              {
                lab: labgrp,
                task: task,
                data: null
              })
          }
          let students = lab.map(e => e.student)
          let studentsId = lab.map(e => e.student.id)
          sails.sendNativeQuery(`SELECT slb.student,
(case when scdl.task IS NOT NULL then scdl.deadline else
 (case when lbtd.deadline IS NOT NULL then lbtd.deadline else topic.deadline end) end) deadline
FROM studentslabgroups slb
LEFT JOIN tasks task ON task.id = $1
LEFT JOIN topics topic ON task.topic = topic.id
LEFT JOIN labgrouptopicdeadline lbtd ON lbtd.group = slb.labgroup AND lbtd.topic = task.topic
LEFT JOIN studentcustomdeadlines scdl ON scdl.student = slb.student AND scdl.task = task.id
WHERE slb.labgroup =$2 AND slb.active=1`, [taskId, labId]).exec((err, result) => {
            if (err) {
              return res.serverError(err)
            }
            let deadlines = result.rows
            students = _.forEach(students, (s) => {
              try {
                s.deadline = dateFormat(deadlines.find(d => d.student === s.id).deadline, 'yyyy-mm-dd')
              } catch (err) {
                return res.serverError(err)
              }
            })
            TaskComments.find({
              task: taskId,
              taskStudent: studentsId,
              user: {'!=': null}
            }).populate('user').exec((err, comments) => {
              if (err) {
                return res.serverError(err)
              }
              if (comments && comments.length && comments.length > 0) {
                for (let s of students) {
                  s.comments = comments.filter(c => c.taskStudent === s.id)
                  _.forEach(s.comments, (c) => {
                    try {
                      c.createdAt = dateFormat(c.createdAt, 'dd/mm/yyyy')
                    } catch (err) {
                      return res.serverError(err)
                    }
                  })
                }
              }
              TaskReplies.find({
                task: taskId,
                student: studentsId,
                lastSent: true
              }).populate('files').exec((err, replies) => {
                if (err) {
                  return res.serverError(err)
                }

                if (!replies || !replies.length || replies.length === 0) {
                  return res.view('teacher/replies/labTasksPartial',
                    {
                      lab: labgrp,
                      task: task,
                      data: students
                    })
                } else {
                  MySqlFile().readManyByReply(replies.map(e => e.id), (err, files) => {
                    if (err) {
                      return res.serverError(err)
                    }

                    let promises = files.map(function (file) {
                      return new Promise(function (resolve, reject) {
                        file.fileSize = bytes(file.fileSize, {unitSeparator: ' '})
                        if (file.fileMimeType.includes('text/')) {
                          let type = ''
                          if (['h', 'c'].includes(file.fileExt)) {
                            type = 'c'
                          } else if (['hpp', 'cpp'].includes(file.fileExt)) {
                            type = 'c++'
                          } else {
                            return resolve(file)
                          }
                          if (file.file.err) {
                            return resolve(file)
                          }
                          let content = '```' + type + '\n' + file.file + '\n```'
                          pdc(content, 'markdown_github-raw_html', 'html5', function (err, result) {
                            if (err) {
                              return reject(err)
                            }
                            file.file = result
                            return resolve(file)
                          })
                        } else {
                          return resolve(file)
                        }
                      })
                    })

                    Promise.all(promises).then((files) => {
                      for (let s of students) {
                        s.reply = replies.find(r => r.student === s.id)
                        if (s.reply) {
                          s.reply.files = files.filter(file => {
                            return file.reply === s.reply.id
                          })
                        }
                      }
                      return res.view('teacher/replies/labTasksPartial',
                        {
                          lab: labgrp,
                          task: task,
                          data: students
                        })
                    })
                  })
                }
              })
            })
          })
        })
      })
    })
  },

  ajaxSetTeacherStatus: function (req, res) {
    let replyId = parseInt(req.param('replyid'), '10')
    let status = parseInt(req.param('status'), '10')
    if (!_.isInteger(replyId) || !_.isInteger(status)) {
      return res.badRequest()
    }
    if (![0, 1, 2].includes(status)) {
      return res.badRequest()
    }
    TaskReplies.update(replyId, {teacherStatus: status}).meta({fetch: true}).exec((err, reply) => {
      if (err) {
        return res.serverError(err)
      }
      if (reply.length !== 1) {
        return res.notFound()
      }
      TaskComments.create({
        taskStudent: reply[0].student,
        task: reply[0].task,
        user: null,
        comment: 'Prowadzący ' + req.localUser.fullName() + (status === 1 ? ' zaliczył Twoje rozwiązanie' : (status === 2 ? ' nie zaliczył Twojego rozwiązania' : ' skasował ocenę')), // todo: kuurwa czemu to tak
        viewed: false
      }).exec((err) => {
        if (err) {
          return res.serverError(err)
        }
        return res.json({error: false})
      })
    })
  },

  ajaxSetBlocked: function (req, res) {
    let studentId = parseInt(req.param('studentid'), '10')
    let taskId = parseInt(req.param('taskid'), '10')
    let blocked = req.param('blocked')
    if (!_.isInteger(studentId) || !_.isInteger(taskId) || !_.isString(blocked)) {
      return res.badRequest()
    }
    blocked = (blocked === 'true')
    TaskReplies.update({
      student: studentId,
      task: taskId
    }, {blocked: blocked}).meta({fetch: true}).exec((err, reply) => {
      if (err) {
        return res.serverError(err)
      }
      if (reply.length === 0) {
        return res.notFound()
      }
      TaskComments.create({
        taskStudent: reply[0].student,
        task: reply[0].task,
        user: null,
        comment: 'Prowadzący ' + req.localUser.fullName() + (blocked ? ' zablokował możliwość przesłania zadania' : ' odblokował możliwość przesłania zadania'), // todo: i to też
        viewed: false
      }).exec((err) => {
        if (err) {
          return res.serverError(err)
        }
        return res.json({error: false})
      })
    })
  },

  ajaxRepostTask: function (req, res) {
    let studentId = parseInt(req.param('studentid'), '10')
    let taskId = parseInt(req.param('taskid'), '10')
    if (!_.isInteger(studentId) || !_.isInteger(taskId)) {
      return res.badRequest()
    }
    ManageReplies.repostTask(studentId, taskId, req.localUser.fullName(), (err) => {
      if (err) {
        switch (err.code) {
          case 'E_USER_NOT_FOUND':
          case 'E_TASK_NOT_FOUND':
          case 'E_REPLY_NOT_FOUND':
          case 'E_REPLY_BLOCKED':
            return res.badRequest(err)
          default:
            res.serverError(err)
        }
      }
      return res.json({error: false})
    })
  },

  ajaxSetStudentTaskDeadline: function (req, res) {
    let taskId = parseInt(req.param('taskid'), '10')
    let studentId = parseInt(req.param('student'), '10')
    let deadline = req.param('deadline')
    if (!_.isInteger(taskId) || !_.isInteger(studentId) || _.isEmpty(deadline)) {
      return res.badRequest()
    }
    if (req.param('remove')) {
      StudentCustomDeadlines.destroy({student: studentId, task: taskId}).exec((err) => {
        if (err) {
          return res.serverError(err)
        }
        return res.json({error: false})
      })
    } else {
      const date = Date.parse(deadline)
      StudentCustomDeadlines.findOrCreate({student: studentId, task: taskId}, {
        student: studentId,
        task: taskId,
        deadline: date
      }).exec((err, scd, created) => {
        if (err) {
          return res.serverError(err)
        }
        if (created) {
          return res.json({error: false})
        }
        StudentCustomDeadlines.update(scd, {deadline: date}).exec((err) => {
          if (err) {
            return res.serverError(err)
          }
          return res.json({error: false})
        })
      })
    }
  },

  ajaxAddComment: function (req, res) {
    let taskId = parseInt(req.param('taskid'), '10')
    let studentId = parseInt(req.param('student'), '10')
    let comment = req.param('comment')
    if (!_.isInteger(taskId) || !_.isInteger(studentId) || _.isEmpty(comment)) {
      return res.badRequest()
    }
    TaskComments.create(
      {task: taskId, taskStudent: studentId, user: req.localUser.id, comment: comment, viewed: false})
      .exec(function (err) {
        if (err) {
          return res.serverError(err)
        }
        return res.json({err: false})
      })
  },

  ajaxCheckComments: function (req, res) {
    let taskId = parseInt(req.param('taskid'), '10')
    let studentId = parseInt(req.param('student'), '10')
    let last = parseInt(req.param('last'), '10')
    if (!_.isInteger(taskId) || !_.isInteger(studentId) || !_.isInteger(last)) {
      return res.badRequest()
    }
    TaskComments.find({task: taskId, taskStudent: studentId, id: {'>': last}, user: {'!=': null}}).populate('user')
      .exec(function (err, task) {
        if (err) {
          return res.serverError(err)
        }
        let com = task.map(c => {
          try {
            return {
              id: c.id,
              date: dateFormat(c.createdAt, 'HH:MM dd/mm/yyyy'),
              comment: c.comment,
              viewed: c.viewed,
              name: c.user.name,
              surname: c.user.surname,
              teacher: c.user.isTeacher
            }
          } catch (err) {
            return res.serverError(err)
          }
        })
        if (com.length === 0) {
          return res.json({error: 'noNew'})
        }

        return res.json({student: studentId, last: _.maxBy(com, 'id').id, comments: com})
      })
  }
}
