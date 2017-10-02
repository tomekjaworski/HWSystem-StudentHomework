/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
const base64 = require('base64-js')
const cs = require('convert-string')

module.exports.bootstrap = function (cb) {
  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  Users.count().exec(function countCB (error, found) {
    if (error) {
      throw error
    }
    if (found === 0) {
      const defUsers = [{
        name: 'Test1',
        surname: 'Tester1',
        album: 123456,
        email: '1@p.lodz.pl',
        password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
        salt: 'aaaa',
        activated: true,
        isAdmin: true,
        isTeacher: true
      }, {
        name: 'Test2',
        surname: 'Tester2',
        album: 654321,
        email: '2@p.lodz.pl',
        password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
        salt: 'aaaa',
        activated: true,
        isTeacher: true
      }]
      for (let i = 3; i < 200; i++) {
        defUsers.push({
          name: 'Test' + i,
          surname: 'Tester' + i,
          album: 200000 - i,
          email: i + '@p.lodz.pl',
          password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
          salt: 'aaaa',
          activated: true
        })
      }
      Subjects.create({
        name: 'Podstawy Programowania',
        desc: 'Podstawy podstaw'
      }).meta({fetch: true})
        .exec(function (err, sub) {
          if (err) {
            throw err
          }

          Users.createEach(defUsers).meta({fetch: true})
            .exec(function (err, users) {
              if (err) {
                throw err
              }
              let students = _.drop(users, 2)
              let groups = _.chunk(students, 50)
              LabGroups.createEach([
                {
                  name: 'd3dx9_41',
                  subject: sub.id,
                  owner: users[0].id,
                  students: groups[0].map(s => s.id)
                }, {
                  name: 'd3dx10_20',
                  subject: sub.id,
                  owner: users[0].id,
                  students: groups[1].map(s => s.id)
                }, {
                  name: 'd3dx11',
                  subject: sub.id,
                  owner: users[1].id,
                  students: groups[2].map(s => s.id)
                }, {
                  name: 'd3dx2',
                  subject: sub.id,
                  owner: users[1].id,
                  students: groups[3].map(s => s.id)
                }
              ]).exec(function (err, lab) {
                if (err) {
                  throw err
                }
                StudentsLabGroups.update({active: false}, {active: true}).exec((err) => {
                  if (err) {
                    throw err
                  }

                  Topics.createEach([
                    {
                      number: '1a',
                      title: 'Testowy temat 1',
                      visible: true,
                      subject: sub.id,
                      deadline: 1527804000000
                    }, {
                      number: '1b',
                      title: 'Testowy temat 2',
                      visible: true,
                      subject: sub.id,
                      deadline: 1527804000000
                    }, {
                      number: '2a',
                      title: 'Testowy temat 2',
                      visible: true,
                      subject: sub.id,
                      deadline: 1527804000000
                    }, {
                      number: '2b',
                      title: 'Testowy temat 2',
                      visible: true,
                      subject: sub.id,
                      deadline: 1527804000000
                    }
                  ]).meta({fetch: true})
                    .exec(function (err, topics) {
                      if (err) {
                        throw err
                      }

                      Tasks.createEach([
                        {
                          number: '1a',
                          title: 'Testowe zadanie 1',
                          visible: true,
                          topic: topics[0].id
                        }, {
                          number: '2a',
                          title: 'Testowe zadanie 2',
                          visible: true,
                          topic: topics[0].id
                        }, {
                          number: '3a',
                          title: 'Testowe zadanie 3',
                          visible: true,
                          topic: topics[0].id
                        }, {
                          number: '1b',
                          title: 'Testowe zadanie 1',
                          visible: true,
                          topic: topics[1].id
                        }, {
                          number: '2b',
                          title: 'Testowe zadanie 2',
                          visible: true,
                          topic: topics[1].id
                        }, {
                          number: '3b',
                          title: 'Testowe zadanie 3',
                          visible: true,
                          topic: topics[1].id
                        }
                      ]).meta({fetch: true})
                        .exec(function (err, tasks) {
                          if (err) {
                            throw err
                          }

                          TaskDescription.createEach([
                            {
                              task: tasks[0].id,
                              description: 'Opis zadania'
                            },
                            {
                              task: tasks[1].id,
                              description: 'Opis zadania'
                            },
                            {
                              task: tasks[2].id,
                              description: 'Opis zadania'
                            },
                            {
                              task: tasks[3].id,
                              description: 'Opis zadania'
                            },
                            {
                              task: tasks[4].id,
                              description: 'Opis zadania'
                            },
                            {
                              task: tasks[5].id,
                              description: 'Opis zadania'
                            }
                          ]).exec(function (err, td) {
                            if (err) {
                              throw err
                            }
                            let replies = []
                            for (let student of students) {
                              let random
                              replies.push({
                                student: student.id,
                                task: tasks[0].id,
                                teacherStatus: 0,
                                machineStatus: 0,
                                sent: random = Math.floor((Math.random() * 2)),
                                lastSent: random,
                                newest: true
                              }, {
                                student: student.id,
                                task: tasks[1].id,
                                teacherStatus: 0,
                                machineStatus: 0,
                                sent: random = Math.floor((Math.random() * 2)),
                                lastSent: random,
                                newest: true
                              }, {
                                student: student.id,
                                task: tasks[2].id,
                                teacherStatus: 0,
                                machineStatus: 0,
                                sent: random = Math.floor((Math.random() * 2)),
                                lastSent: random,
                                newest: true
                              }, {
                                student: student.id,
                                task: tasks[3].id,
                                teacherStatus: 0,
                                machineStatus: 0,
                                sent: random = Math.floor((Math.random() * 2)),
                                lastSent: random,
                                newest: true
                              }, {
                                student: student.id,
                                task: tasks[4].id,
                                teacherStatus: 0,
                                machineStatus: 0,
                                sent: random = Math.floor((Math.random() * 2)),
                                lastSent: random,
                                newest: true
                              }, {
                                student: student.id,
                                task: tasks[5].id,
                                teacherStatus: 0,
                                machineStatus: 0,
                                sent: random = Math.floor((Math.random() * 2)),
                                lastSent: random,
                                newest: true
                              })
                            }

                            TaskReplies.createEach(replies).meta({fetch: true})
                              .exec(function (err, tr) {
                                if (err) {
                                  throw err
                                }
                                let trf = []
                                let i = 1
                                for (let reply of tr) {
                                  trf.push({
                                    reply: reply.id,
                                    fileName: 'main',
                                    fileSize: 200,
                                    fileExt: 'cpp',
                                    fileMimeType: 'text/plain',
                                    firstFileId: i,
                                    file: i++
                                  }, {
                                    reply: reply.id,
                                    fileName: 'main',
                                    fileSize: 200,
                                    fileExt: 'h',
                                    fileMimeType: 'text/plain',
                                    firstFileId: i,
                                    file: i++
                                  })
                                }

                                TaskReplyFiles.createEach(trf).meta({fetch: true})
                                  .exec(function (err, trf) {
                                    if (err) {
                                      throw err
                                    }
                                    let trfc = []
                                    for (let file of trf) {
                                      if (file.fileExt === 'cpp') {
                                        trfc.push({
                                          id: file.file,
                                          file: file.id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 0;\n}'))
                                        })
                                      } else {
                                        trfc.push({
                                          id: file.file,
                                          file: file.id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main();'))
                                        })
                                      }
                                    }
                                    TaskReplyFileContent.createEach(trfc).exec(function (err, trfc) {
                                      if (err) {
                                        throw err
                                      }

                                      let tc = []
                                      for (let reply of tr) {
                                        tc.push({
                                          taskStudent: reply.student,
                                          task: reply.task,
                                          user: users[Math.floor((Math.random() * 2))].id,
                                          comment: 'Test message from Teacher',
                                          viewed: false
                                        },
                                          {
                                            taskStudent: reply.student,
                                            task: reply.task,
                                            user: reply.student,
                                            comment: 'Test message from User',
                                            viewed: false
                                          })
                                      }

                                      TaskComments.createEach(tc).exec(function (err) {
                                        if (err) {
                                          throw err
                                        }

                                        return cb()
                                      })
                                    })
                                  })
                              })
                          })
                        })
                    })
                })
              })
            })
        })
    } else {
      cb()
    }
  })
}
