/**
 * StudentController
 *
 * @description :: Server-side logic for managing Students
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const dateFormat = require('dateformat')
const pdc = require('pdc')

const StudentController = module.exports = {
  noLab (req, res) {
    StudentsLabGroups.findOne({student: req.localUser.id}).populate('labgroup').exec((err, lab) => {
      if (err) {
        return res.serverError(err)
      }
      if (req.wantsJSON) {
        if (!lab) {
          return res.forbidden(req.i18n.__('student.nolab'))
        }
        return res.forbidden(req.i18n.__('student.nolab.inactive.%s', lab.labgroup.name))
      }
      return res.view('student/nolab', {lab: lab})
    })
  },
  /***
   * @description :: Main student view, exposes topics to student or tasks in topic
   * @route       :: /topics
   * @route       :: /topic/:topicid/tasks
   */
  index (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).populate('labgroup').exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }

      sails.sendNativeQuery('SELECT topics.id topicId, topics.number topicNumber, topics.title topicTitle, topics.deadline topicDeadline, \n' +
        '    COUNT(tasks.id) taskCount, \n' +
        '    COUNT(replies.id) repliesCount, \n' +
        '    sum(case when replies.teacherStatus = 1 then 1 else 0 end) repliesTeacherAccepted,\n' +
        '    sum(case when replies.teacherStatus = 2 then 1 else 0 end) repliesTeacherRejected,\n' +
        '    sum(case when replies.blocked = 1 then 1 else 0 end) repliesBlocked,\n' +
        '    COUNT(DISTINCT comments.task) repliesCommented,\n' +
        '    sum(case when replies.machineOk = 1 then 1 else 0 end) repliesMachineAccepted,\n' +
        '    sum(case when replies.machineOk = 2 then 1 else 0 end) repliesMachineRejected,\n' +
        '    sum(case when (replies.machineOk = 1 and replies.teacherStatus = 1 AND replies.blocked = 0) then 1 else 0 end) repliesAccepted\n' +
        '    FROM topics\n' +
        'LEFT JOIN tasks ON tasks.topic = topics.id\n' +
        'LEFT JOIN taskreplies AS replies ON replies.task = tasks.id AND replies.student = $1 AND replies.lastSent = 1 AND replies.newest = 1 \n' +
        'LEFT JOIN ( SELECT task, taskStudent FROM taskcomments GROUP BY task, taskStudent ) comments ON comments.task = tasks.id AND comments.taskStudent = $1\n' +
        'WHERE topics.visible = 1\n' +
        'GROUP BY topics.id ORDER BY CAST(topics.number AS UNSIGNED)', [req.localUser.id]).exec((err, data) => {
          if (err) {
            return res.serverError(err)
          }
          let ret = {message: lab.labgroup.message, topics: data.rows}
          let taskView = parseInt(req.param('topicid'))
          if (!isNaN(taskView)) {
            ret.taskView = taskView
          }
          return res.view('student/index', {data: ret})
        }
      )
    })
  },

  /***
   * @description :: Ajax api for getting list of task in selected topic
   * @route       :: /ajax/topic/:id/tasks
   */
  tasks (req, res) {
    let topicId = parseInt(req.param('id'), '10')
    if (!_.isInteger(topicId)) {
      return res.badRequest()
    }
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      Topics.count({'id': topicId, visible: true}, (err, count) => {
        if (err) {
          return res.serverError(err)
        }
        if (count !== 1) {
          return res.notFound()
        }
        sails.sendNativeQuery('SELECT tasks.id, tasks.number, tasks.title,\n' +
          '(case when reply.lastSent = 1 then 1 else 0 end) hasReply,\n' +
          '(case when comments.task IS NOT NULL then 1 else 0 end) hasComments,\n' +
          '(case when reply.id IS NOT NULL then reply.teacherStatus else 0 end) teacherStatus,\n' +
          '(case when reply.id IS NOT NULL then reply.machineStatus else 0 end) machineStatus,\n' +
          '(case when reply.id IS NOT NULL then reply.machineOk else 0 end) machineOk,\n' +
          '(case when reply.id IS NOT NULL then reply.blocked else 0 end) blocked,\n' +
          '(case when scd.task IS NOT NULL then scd.deadline else\n' +
          ' (case when groupdeadline.deadline IS NOT NULL then groupdeadline.deadline else topics.deadline end) end) deadline\n' +
          'FROM tasks\n' +
          'LEFT JOIN taskreplies reply ON reply.task = tasks.id AND reply.student = $1 AND reply.lastSent = 1 AND reply.newest = 1 \n' +
          'LEFT JOIN taskcomments comments ON comments.task = tasks.id AND comments.taskStudent = $1 AND comments.viewed = false\n' +
          'LEFT JOIN topics ON topics.id = tasks.topic\n' +
          'LEFT JOIN studentcustomdeadlines scd ON scd.task = tasks.id AND scd.student = $1 \n' +
          'LEFT JOIN labgrouptopicdeadline groupdeadline ON groupdeadline.group = $2 AND groupdeadline.topic = $3 \n' +
          'WHERE tasks.topic = $3\n' +
          'GROUP BY tasks.id, reply.id, tasks.topic, scd.deadline, groupdeadline.deadline ORDER BY CAST(tasks.number AS UNSIGNED), tasks.id',
          [req.localUser.id, lab.labgroup, topicId]).exec((err, data) => {
            if (err) {
              return res.serverError(err)
            }
            data.rows = _.forEach(data.rows, (e) => {
              try {
                e.deadline = dateFormat(e.deadline, 'dd/mm/yyyy')
              } catch (err) {
                return res.serverError(err)
              }
            })
            return res.json(data.rows)
          }
        )
      })
    })
  },
  task (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      switch (req.method) {
        case 'GET':

          let topicparam = parseInt(req.param('topicid'), '10')
          let taskparam = parseInt(req.param('taskid'), '10')
          if (!_.isInteger(topicparam) || !_.isInteger(taskparam)) {
            return res.notFound()
          }

          Topics.findOne({id: topicparam, visible: true}).exec(function (err, topic) {
            if (err) {
              return res.badRequest(err)
            }

            if (!topic) {
              return res.notFound()
            }

            Tasks.findOne({
              id: taskparam,
              topic: topicparam,
              visible: true
            }).populate('description').exec(function (err, task) {
              if (err) {
                return res.badRequest(err)
              }

              if (!task) {
                return res.notFound()
              }

              task.description = task.description[0].description

              pdc(task.description, 'markdown_github-raw_html', 'html5', function (err, result) {
                if (err) {
                  return res.serverError(err)
                }
                CustomCodes.formatText(result, false, result => {
                  task.description = result
                  ManageReplies.getStudentDeadline(taskparam, req.localUser.id, (err, deadline) => {
                    if (err) {
                      return res.serverError(err)
                    }
                    if (!deadline) {
                      return res.forbidden(req.i18n.__('student.inactive'))
                    }

                    let deadlineCanSend = deadline > Date.now()

                    TaskComments.find({
                      task: task.id,
                      taskStudent: req.localUser.id
                    }).populate('user').exec(function (err, taskComments) {
                      if (err) {
                        return res.serverError(err)
                      }

                      if (taskComments.length > 0) {
                        taskComments = _.forEach(taskComments, (comment) => {
                          try {
                            comment.createdAt = dateFormat(comment.createdAt, 'HH:MM dd/mm/yyyy')
                          } catch (err) {
                            return res.serverError(err)
                          }
                        })
                      }

                      TaskReplies.findOne({student: req.localUser.id, task: task.id, newest: true})
                        .exec(function (err, taskReply) {
                          if (err) {
                            return res.serverError(err)
                          }
                          if (!taskReply) {
                            try {
                              return res.view('student/task', {
                                topic: topic,
                                task: task,
                                taskReply: taskReply,
                                taskReplyFiles: null,
                                deadline: dateFormat(deadline, 'dd/mm/yyyy'),
                                deadlineCanSend: deadlineCanSend,
                                taskComments: taskComments,
                                title: task.title
                              })
                            } catch (err) {
                              return res.serverError(err)
                            }
                          }
                          MySqlFile().ls(taskReply.id, (err, taskReplyFiles) => {
                            if (err) {
                              return res.serverError(err)
                            }
                            try {
                              return res.view('student/task', {
                                topic: topic,
                                task: task,
                                taskReply: taskReply,
                                taskReplyFiles: taskReplyFiles,
                                deadline: dateFormat(deadline, 'dd/mm/yyyy'),
                                deadlineCanSend: deadlineCanSend,
                                taskComments: taskComments,
                                title: task.title
                              })
                            } catch (err) {
                              return res.serverError(err)
                            }
                          })
                        })
                    })
                  })
                })
              })
            })
          })
          break

        case 'POST':

          let task = parseInt(req.param('taskid'), '10')
          let action = req.param('action')
          if (!_.isInteger(task)) {
            return res.badRequest()
          }

          // Ajax
          Tasks.count({id: task}, (err, count) => {
            if (err) {
              return res.serverError(err)
            }
            if (count === 0) {
              return res.notFound()
            }
            if (action === 'markAsRead') {
              TaskComments.update({task: task, taskStudent: req.localUser.id, viewed: false}, {viewed: true})
                .exec(function (err) {
                  if (err) {
                    return res.serverError(err)
                  }
                  return res.json({'err': false})
                })
            } else if (action === 'sendComment') {
              let comment = req.param('comment')
              if (!comment || _.isEmpty(_.trim(comment))) {
                return res.badRequest()
              }
              TaskComments.create(
                {task: task, taskStudent: req.localUser.id, user: req.localUser.id, comment: comment, viewed: false})
                .exec(function (err) {
                  if (err) {
                    return res.serverError(err)
                  }
                  StudentsLabGroups.findOne({student: req.localUser.id, active: true}).exec((err, lab) => {
                    if (err) {
                      return res.serverError(err)
                    }
                    if (!lab) {
                      return res.forbidden(req.i18n.__('student.inactive'))
                    }
                    RecentAction.addStudentComment(req.localUser.id, task, lab.labgroup, (err) => {
                      if (err) {
                        return res.serverError(err)
                      }
                      return res.json({'err': false})
                    })
                  })
                })
            }
          })
      }
    })
  },

  ajaxGetFileContent (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      const id = parseInt(req.param('id'), '10')
      const replyId = parseInt(req.param('replyid'), '10')
      if (!_.isInteger(id) || !_.isInteger(replyId)) {
        return res.badRequest()
      }
      MySqlFile().read(id, (err, file) => {
        if (err) {
          if (err.code === 400) {
            return res.notFound()
          }
          if (err.code === 'E_FILE_CONTENTS_NOT_FOUND') {
            return res.serverError(req.i18n.__('student.task.error.emptyfile'))
          }
          return res.serverError(err)
        }
        if (file.reply.student !== req.localUser.id) {
          return res.forbidden()
        }
        let content = 'ni mo' // todo: ni mo czego? wut?
        if (file.file) {
          if (file.fileMimeType.includes('text/')) {
            let type = ''
            if (['h', 'c'].includes(file.fileExt)) {
              type = 'c'
            } else if (['hpp', 'cpp'].includes(file.fileExt)) {
              type = 'c++'
            } else {
              return res.json({
                mimeType: file.fileMimeType,
                title: file.fileName + '.' + file.fileExt,
                ext: file.fileExt,
                body: file.file
              })
            }
            content = '```' + type + '\n' + file.file + '\n```'
            pdc(content, 'markdown_github-raw_html', 'html5', function (err, result) {
              if (err) {
                return res.serverError(err)
              }
              return res.json({
                mimeType: file.fileMimeType,
                title: file.fileName + '.' + file.fileExt,
                ext: file.fileExt,
                body: result
              })
            })
          } else {
            return res.json({
              mimeType: file.fileMimeType,
              title: file.fileName + '.' + file.fileExt,
              ext: file.fileExt,
              body: file.file
            })
          }
        } else {
          return res.json({
            mimeType: file.fileMimeType,
            title: file.fileName + '.' + file.fileExt,
            ext: file.fileExt,
            body: content
          })
        }
      })
    })
  },

  downloadTaskFile (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      const fileid = parseInt(req.param('fileid'), '10')
      if (!_.isInteger(fileid)) {
        return res.badRequest()
      }
      MySqlFile({convert: false}).read(fileid, (err, file) => {
        if (err) {
          if (err.code === 400) {
            return res.notFound()
          }
          return res.serverError(err)
        }
        if (file.reply.student !== req.localUser.id) {
          return res.forbidden()
        }
        if (file.file) {
          res.set('Content-disposition', 'attachment; filename=' + file.fileName + '.' + file.fileExt)
          return res.end(Buffer.from(file.file))
        } else {
          return res.serverError()
        }
      })
    })
  },

  updateFile (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      const fileid = parseInt(req.param('fileid'), '10')
      const replyid = parseInt(req.param('replyid'), '10')
      if (!_.isInteger(fileid) || !_.isInteger(replyid)) {
        return res.badRequest()
      }
      TaskReplies.findOne(replyid).populate('task')
        .exec((err, reply) => {
          if (err) {
            return res.serverError(err)
          }
          if (!reply) {
            return res.notFound()
          }
          if (reply.student !== req.localUser.id) {
            return res.forbidden()
          }
          if (reply.lastSent || reply.blocked) {
            return res.forbidden()
          }
          ManageReplies.getStudentDeadline(reply.task.id, req.localUser.id, (err, deadline) => {
            if (err) {
              return res.serverError(err)
            }
            if (!deadline) {
              return res.forbidden(req.i18n.__('student.inactive'))
            }
            if (deadline < Date.now()) {
              return res.forbidden(req.i18n.__('student.task.files.afterdeadline'))
            }
            if (reply.lastSent === true) {
              return res.redirect('/topic/' + reply.task.topic + '/task/' + reply.task.id + '?msg=cantUploadReplaySent')
            }
            req.file('file').upload({adapter: MySqlFile, replyId: reply.id, updateFileId: fileid}, (err, files) => {
              if (err) {
                if (err.code === 'E_EXCEEDS_UPLOAD_LIMIT') {
                  return res.redirect('/topic/' + reply.task.topic + '/task/' + reply.task.id + '?msg=fileTooBig')
                } else if (err.code === 'E_EXTENSION_NOT_ALLOWED') {
                  return res.redirect('/topic/' + reply.task.topic + '/task/' + reply.task.id + '?msg=extNotAllowed')
                }
                return res.serverError(err)
              }
              return res.redirect('/topic/' + reply.task.topic + '/task/' + reply.task.id + '?msg=fileUpdateSuccess')
            })
          })
        })
    })
  },

  uploadTaskFiles (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      const topicid = parseInt(req.param('topicid'), '10')
      const taskid = parseInt(req.param('taskid'), '10')
      if (!_.isInteger(topicid) || !_.isInteger(taskid)) {
        return res.badRequest()
      }
      ManageReplies.getStudentDeadline(taskid, req.localUser.id, (err, deadline) => {
        if (err) {
          return res.serverError(err)
        }
        if (!deadline) {
          return res.forbidden(req.i18n.__('student.inactive'))
        }
        if (deadline < Date.now()) {
          return res.forbidden(req.i18n.__('student.task.files.afterdeadline'))
        }
        TaskReplies.findOrCreate({
          student: req.localUser.id,
          task: taskid,
          newest: true
        }, {
          student: req.localUser.id,
          task: taskid,
          newest: true
        })
          .exec((err, reply) => {
            if (err) {
              return res.serverError(err)
            }
            if (reply.lastSent === true) {
              return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=cantUploadReplySent')
            }
            if (reply.blocked) {
              return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=cantUploadBlocked')
            }
            req.file('files').upload({adapter: MySqlFile, replyId: reply.id}, (err, files) => {
              if (err) {
                if (err.code === 'E_EXCEEDS_UPLOAD_LIMIT') {
                  return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=fileTooBig')
                } else if (err.code === 'E_EXTENSION_NOT_ALLOWED') {
                  return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=extNotAllowed')
                }
                return res.serverError(err)
              }
              return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=fileUploadSuccess')
            })
          })
      })
    })
  },

  ajaxRemoveFile (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      const id = parseInt(req.param('id'), '10')
      const reply = parseInt(req.param('reply'), '10')
      if (!_.isInteger(id) || !_.isInteger(reply)) {
        return res.badRequest()
      }
      TaskReplyFiles.findOne({id: id, reply: reply, visible: true})
        .populate('reply')
        .exec((err, file) => {
          if (err) {
            return res.serverError(err)
          }
          if (!file) {
            return res.notFound()
          }
          if (file.reply.student !== req.localUser.id) {
            return res.forbidden()
          }
          if (file.reply.lastSent || file.reply.blocked) {
            return res.forbidden()
          }
          ManageReplies.getStudentDeadline(file.reply.task, req.localUser.id, (err, deadline) => {
            if (err) {
              return res.serverError(err)
            }
            if (!deadline) {
              return res.forbidden(req.i18n.__('student.inactive'))
            }
            if (deadline < Date.now()) {
              return res.forbidden(req.i18n.__('student.task.files.afterdeadline'))
            }
            file.visible = false
            TaskReplyFiles.update({id: id, reply: reply, visible: true}).set({visible: false}).exec((err) => {
              if (err) {
                return res.serverError(err)
              }
              return res.json({error: false})
            })
          })
        })
    })
  },

  sendReply (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      const topicid = parseInt(req.param('topicid'), '10')
      const taskid = parseInt(req.param('taskid'), '10')
      if (!_.isInteger(topicid) || !_.isInteger(taskid)) {
        return res.badRequest()
      }
      ManageReplies.getStudentDeadline(taskid, req.localUser.id, (err, deadline) => {
        if (err) {
          return res.serverError(err)
        }
        if (!deadline) {
          return res.forbidden(req.i18n.__('student.inactive'))
        }
        if (deadline < Date.now()) {
          return res.forbidden(req.i18n.__('student.task.files.afterdeadline'))
        }
        TaskReplies.findOne({
          student: req.localUser.id,
          task: taskid,
          newest: true
        }).exec((err, reply) => {
          if (err) {
            return res.serverError(err)
          }
          if (!reply) {
            return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=noFilesInReply')
          }
          if (reply.lastSent === true) {
            return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=replyAlreadySent')
          }
          if (reply.blocked === true) {
            return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=replyBlocked')
          }
          MySqlFile().ls(reply.id, (err, replyFiles) => {
            if (err) {
              return res.serverError(err)
            }
            if (replyFiles.length === 0) {
              return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=noFilesInReply')
            }
            TaskReplies.update({
              task: taskid,
              student: req.localUser.id,
              lastSent: true
            }, {lastSent: false}).exec((err) => {
              if (err) {
                return res.serverError(err)
              }
              TaskReplies.update(reply, {
                sent: true,
                lastSent: true,
                teacherStatus: 0,
                machineMessage: '',
                machineOk: 0,
                machineReport: '',
                machineStatus: 0
              }).exec((err) => {
                if (err) {
                  return res.serverError(err)
                }
                StudentsLabGroups.findOne({student: req.localUser.id, active: true}).exec((err, lab) => {
                  if (err) {
                    return res.serverError(err)
                  }
                  if (!lab) {
                    return res.forbidden(req.i18n.__('student.inactive'))
                  }
                  RecentAction.sendTaskReply(req.localUser.id, taskid, lab.labgroup, reply.sent, (err) => {
                    if (err) {
                      return res.serverError(err)
                    }
                    ManageReplies.machine.updateTimeout(req.localUser.id, taskid, reply.id)
                    return res.redirect('/topic/' + topicid + '/task/' + taskid + '?msg=replySent')
                  })
                })
              })
            })
          })
        })
      })
    })
  },

  ajaxCommentsCheck (req, res) {
    StudentsLabGroups.findOne({
      student: req.localUser.id,
      active: true
    }).exec(function (err, lab) {
      if (err) {
        return res.serverError(err)
      }
      if (!lab) {
        return StudentController.noLab(req, res)
      }
      const taskId = parseInt(req.param('task'), '10')
      const lastComment = parseInt(req.param('lastComment'), '10')
      if (!_.isInteger(taskId) || !_.isInteger(lastComment)) {
        return res.badRequest()
      }

      if (req.method === 'GET') {
        Tasks.findOne(taskId).exec(function (err, taskw) {
          if (err) {
            return res.serverError(err)
          }

          if (!taskw) {
            return res.notFound()
          }

          TaskComments.find({task: taskw.id, taskStudent: req.localUser.id, id: {'>': lastComment}}).populate('user')
            .exec(function (err, task) {
              if (err) {
                return res.serverError(err)
              }
              let com = task.map(c => {
                try {
                  return {
                    id: c.id,
                    createdAt: dateFormat(c.createdAt, 'HH:MM dd/mm/yyyy'),
                    comment: c.comment,
                    viewed: c.viewed,
                    // viewed: (c.viewed ? 'przeczytane' : 'nieprzeczytane'),
                    user: (c.user ? {
                      id: c.user.id,
                      name: c.user.name,
                      surname: c.user.surname,
                      isTeacher: c.user.isTeacher
                    } : null)
                  }
                } catch (err) {
                  return res.serverError(err)
                }
              })

              return res.json(com)
            })
        })
      }
    })
  }
}
