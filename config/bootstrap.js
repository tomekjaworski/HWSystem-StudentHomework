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
      Roles.createEach([
        {
          name: 'admin'
        }, {
          name: 'teacher'
        }, {
          name: 'student'
        }
      ]).meta({fetch: true})
        .exec(function (err, roles) {
          if (err) {
            throw err
          }

          Subjects.create({
            name: 'Podstawy Programowania',
            desc: 'Podstawy podstaw'
          }).meta({fetch: true})
            .exec(function (err, sub) {
              if (err) {
                throw err
              }

              Users.createEach([
                {
                  name: 'Test1',
                  surname: 'Tester1',
                  album: 123456,
                  email: '1@p.lodz.pl',
                  password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                  salt: 'aaaa',
                  activated: true,
                  roles: [roles[0].id, roles[1].id]
                }, {
                  name: 'Test2',
                  surname: 'Tester2',
                  album: 654321,
                  email: '2@p.lodz.pl',
                  password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                  salt: 'aaaa',
                  activated: true,
                  roles: [roles[1].id]
                }, {
                  name: 'Test3',
                  surname: 'Tester3',
                  album: 456123,
                  email: '3@p.lodz.pl',
                  password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                  salt: 'aaaa',
                  activated: true,
                  roles: [roles[2].id]
                }, {
                  name: 'Test4',
                  surname: 'Tester4',
                  album: 321654,
                  email: '4@p.lodz.pl',
                  password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                  salt: 'aaaa',
                  activated: true,
                  roles: [roles[2].id]
                }
              ]).meta({fetch: true})
                .exec(function (err, users) {
                  if (err) {
                    throw err
                  }

                  LabGroups.createEach([
                    {
                      name: 'd3dx9_41',
                      subject: sub.id,
                      owner: users[0].id,
                      students: [users[2].id]
                    }, {
                      name: 'd3dx10_20',
                      subject: sub.id,
                      owner: users[0].id,
                      students: [users[3].id]
                    }, {
                      name: 'd3dx11',
                      subject: sub.id,
                      owner: users[1].id
                    }, {
                      name: 'd3dx2',
                      subject: sub.id,
                      owner: users[1].id
                    }
                  ]).exec(function (err, lab) {
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

                              TaskReplies.createEach([
                                {
                                  student: users[2].id,
                                  task: tasks[0].id,
                                  teacherStatus: 1,
                                  machineStatus: 2
                                }, {
                                  student: users[2].id,
                                  task: tasks[1].id,
                                  teacherStatus: 0,
                                  machineStatus: 2
                                }, {
                                  student: users[2].id,
                                  task: tasks[2].id,
                                  teacherStatus: 2,
                                  machineStatus: 0
                                }, {
                                  student: users[3].id,
                                  task: tasks[3].id,
                                  teacherStatus: 0,
                                  machineStatus: 0
                                }, {
                                  student: users[3].id,
                                  task: tasks[4].id,
                                  teacherStatus: 0,
                                  machineStatus: 3
                                }, {
                                  student: users[3].id,
                                  task: tasks[5].id,
                                  teacherStatus: 1,
                                  machineStatus: 2
                                }
                              ]).meta({fetch: true})
                                .exec(function (err, tr) {
                                  if (err) {
                                    throw err
                                  }

                                  TaskReplyFiles.createEach([
                                    {
                                      reply: tr[0].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 1
                                    }, {
                                      reply: tr[0].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'h',
                                      fileMimeType: 'text/plain',
                                      file: 2
                                    }, {
                                      reply: tr[1].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'c',
                                      fileMimeType: 'text/plain',
                                      file: 3
                                    }, {
                                      reply: tr[1].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 4
                                    }, {
                                      reply: tr[2].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 5
                                    }, {
                                      reply: tr[2].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 6
                                    }, {
                                      reply: tr[3].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 7
                                    }, {
                                      reply: tr[3].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 8
                                    }, {
                                      reply: tr[4].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 9
                                    }, {
                                      reply: tr[4].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 10
                                    }, {
                                      reply: tr[5].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 11
                                    }, {
                                      reply: tr[5].id,
                                      fileName: 'main',
                                      fileSize: 200,
                                      fileExt: 'cpp',
                                      fileMimeType: 'text/plain',
                                      file: 12
                                    }
                                  ]).meta({fetch: true})
                                    .exec(function (err, trf) {
                                      if (err) {
                                        throw err
                                      }
                                      TaskReplyFileContent.createEach([
                                        {
                                          file: trf[0].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 0;\n}'))
                                        },
                                        {
                                          file: trf[1].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main();'))
                                        },
                                        {
                                          file: trf[2].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 666;\n}'))
                                        },
                                        {
                                          file: trf[3].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 1;\n}'))
                                        },
                                        {
                                          file: trf[4].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 2;\n}'))
                                        },
                                        {
                                          file: trf[5].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 3;\n}'))
                                        },
                                        {
                                          file: trf[6].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 4;\n}'))
                                        },
                                        {
                                          file: trf[7].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 5;\n}'))
                                        },
                                        {
                                          file: trf[8].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 6;\n}'))
                                        },
                                        {
                                          file: trf[9].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 7;\n}'))
                                        },
                                        {
                                          file: trf[10].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 8;\n}'))
                                        },
                                        {
                                          file: trf[11].id,
                                          content: base64.fromByteArray(cs.UTF8.stringToBytes('int main(){\n\treturn 9;\n}'))
                                        }
                                      ]).exec(function (err, trfc) {
                                        if (err) {
                                          throw err
                                        }

                                        TaskComments.createEach([
                                          {
                                            taskStudent: users[2].id,
                                            task: tasks[0].id,
                                            user: users[1].id,
                                            comment: 'Test message from Teacher',
                                            viewed: false
                                          },
                                          {
                                            taskStudent: users[3].id,
                                            task: tasks[3].id,
                                            user: users[1].id,
                                            comment: 'Test message from Teacher',
                                            viewed: false
                                          },
                                          {
                                            taskStudent: users[2].id,
                                            task: tasks[0].id,
                                            user: users[2].id,
                                            comment: 'Test message from Student',
                                            viewed: false
                                          },
                                          {
                                            taskStudent: users[3].id,
                                            task: tasks[3].id,
                                            user: users[3].id,
                                            comment: 'Test message from Student',
                                            viewed: false
                                          }
                                        ]).exec(function (err, trc) {
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
