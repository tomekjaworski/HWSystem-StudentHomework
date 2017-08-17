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

module.exports.bootstrap = function ( cb ) {

    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    Users.count().exec(function countCB( error, found ) {
        if ( error ) {
            throw error;
        }
        if ( found === 0 ) {
            Roles.create([
                {
                    name: 'admin'
                }, {
                    name: 'teacher'
                }, {
                    name: 'student'
                }
            ]).exec(function ( err, roles ) {
                if ( err ) {
                    throw err;
                }

                Subjects.create({
                    name: 'Podstawy Programowania',
                    desc: 'Podstawy podstaw'
                }).exec(function ( err, sub ) {
                    if ( err ) {
                        throw err;
                    }

                    Users.create([
                        {
                            name: 'Test1',
                            surname: 'Tester1',
                            album: 123456,
                            email: '1@p.lodz.pl',
                            password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                            salt: 'aaaa',
                            activated: true,
                            roles: [ roles[ 0 ] ]
                        }, {
                            name: 'Test2',
                            surname: 'Tester2',
                            album: 654321,
                            email: '2@p.lodz.pl',
                            password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                            salt: 'aaaa',
                            activated: true,
                            roles: [ roles[ 1 ] ]
                        }, {
                            name: 'Test3',
                            surname: 'Tester3',
                            album: 456123,
                            email: '3@p.lodz.pl',
                            password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                            salt: 'aaaa',
                            activated: true,
                            roles: [ roles[ 2 ] ]
                        }, {
                            name: 'Test4',
                            surname: 'Tester4',
                            album: 321654,
                            email: '4@p.lodz.pl',
                            password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                            salt: 'aaaa',
                            activated: true,
                            roles: [ roles[ 2 ] ]
                        }
                    ]).exec(function ( err, users ) {
                        if ( err ) {
                            throw err;
                        }

                        LabGroups.create([
                            {
                                name: 'd3dx9_41',
                                subject: sub,
                                owner: users[ 1 ],
                                time: '8:15 - 10:00',
                                date: 0,
                                students: [ users[ 2 ] ]
                            }, {
                                name: 'd3dx10_20',
                                subject: sub,
                                owner: users[ 1 ],
                                time: '10:15 - 12:00',
                                date: 1,
                                students: [ users[ 3 ] ]
                            }, {
                                name: 'd3dx11',
                                subject: sub,
                                owner: users[ 1 ],
                                time: '12:15 - 14:00',
                                date: 2
                            }, {
                                name: 'd3dx2',
                                subject: sub,
                                owner: users[ 1 ],
                                time: '14:15 - 16:00',
                                date: 3
                            }
                        ]).exec(function ( err, lab ) {
                            if ( err ) {
                                throw err;
                            }

                            Topics.create([
                                {
                                    number: '1a',
                                    title: 'Testowy temat 1',
                                    visible: true,
                                    deadline: new Date()
                                }, {
                                    number: '1b',
                                    title: 'Testowy temat 2',
                                    visible: true,
                                    deadline: new Date()
                                }, {
                                    number: '2a',
                                    title: 'Testowy temat 2',
                                    visible: true,
                                    deadline: new Date()
                                }, {
                                    number: '2b',
                                    title: 'Testowy temat 2',
                                    visible: true,
                                    deadline: new Date()
                                }
                            ]).exec(function ( err, topics ) {
                                if ( err ) {
                                    throw err;
                                }

                                Tasks.create([
                                    {
                                        number: '1a',
                                        title: 'Testowe zadanie 1',
                                        visible: true,
                                        topic: topics[ 0 ]
                                    }, {
                                        number: '2a',
                                        title: 'Testowe zadanie 2',
                                        visible: true,
                                        topic: topics[ 0 ]
                                    }, {
                                        number: '3a',
                                        title: 'Testowe zadanie 3',
                                        visible: true,
                                        topic: topics[ 0 ]
                                    }, {
                                        number: '1b',
                                        title: 'Testowe zadanie 1',
                                        visible: true,
                                        topic: topics[ 1 ]
                                    }, {
                                        number: '2b',
                                        title: 'Testowe zadanie 2',
                                        visible: true,
                                        topic: topics[ 1 ]
                                    }, {
                                        number: '3b',
                                        title: 'Testowe zadanie 3',
                                        visible: true,
                                        topic: topics[ 1 ]
                                    }
                                ]).exec(function ( err, tasks ) {
                                    if ( err ) {
                                        throw err;
                                    }

                                    TaskDescription.create([
                                        {
                                            task: tasks[ 0 ],
                                            description: 'Opis zadania'
                                        },
                                        {
                                            task: tasks[ 1 ],
                                            description: 'Opis zadania'
                                        },
                                        {
                                            task: tasks[ 2 ],
                                            description: 'Opis zadania'
                                        },
                                        {
                                            task: tasks[ 3 ],
                                            description: 'Opis zadania'
                                        },
                                        {
                                            task: tasks[ 4 ],
                                            description: 'Opis zadania'
                                        },
                                        {
                                            task: tasks[ 5 ],
                                            description: 'Opis zadania'
                                        }
                                    ]).exec(function ( err, td ) {
                                        if ( err ) {
                                            throw err;
                                        }

                                        TaskReplies.create([
                                            {
                                                student: users[ 2 ],
                                                task: tasks[ 0 ],
                                                teacherStatus: 1,
                                                machineStatus: 2
                                            }, {
                                                student: users[ 2 ],
                                                task: tasks[ 1 ],
                                                teacherStatus: 0,
                                                machineStatus: 2
                                            }, {
                                                student: users[ 2 ],
                                                task: tasks[ 2 ],
                                                teacherStatus: 2,
                                                machineStatus: 0
                                            }, {
                                                student: users[ 3 ],
                                                task: tasks[ 3 ],
                                                teacherStatus: 0,
                                                machineStatus: 0
                                            }, {
                                                student: users[ 3 ],
                                                task: tasks[ 4 ],
                                                teacherStatus: 0,
                                                machineStatus: 3
                                            }, {
                                                student: users[ 3 ],
                                                task: tasks[ 5 ],
                                                teacherStatus: 1,
                                                machineStatus: 1
                                            }
                                        ]).exec(function ( err, tr ) {
                                            if ( err ) {
                                                throw err;
                                            }

                                            TaskReplyFiles.create([
                                                {
                                                    reply: tr[ 0 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 0 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'h',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 1 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'c',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 1 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 2 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 2 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 3 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 3 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 4 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 4 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 5 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }, {
                                                    reply: tr[ 5 ],
                                                    fileName: 'main',
                                                    fileSize: 200,
                                                    fileExt: 'cpp',
                                                    fileMimeType: 'text/plain'
                                                }
                                            ]).exec(function ( err, trf ) {
                                                if ( err ) {
                                                    throw err;
                                                }

                                                TaskReplyComments.create([
                                                    {
                                                        reply: tr[ 0 ],
                                                        user: users[ 1 ],
                                                        comment: 'Test message from Teacher',
                                                        viewed: false
                                                    },
                                                    {
                                                        reply: tr[ 1 ],
                                                        user: users[ 1 ],
                                                        comment: 'Test message from Teacher',
                                                        viewed: false
                                                    },
                                                    {
                                                        reply: tr[ 0 ],
                                                        user: users[ 2 ],
                                                        comment: 'Test message from Student',
                                                        viewed: false
                                                    },
                                                    {
                                                        reply: tr[ 1 ],
                                                        user: users[ 2 ],
                                                        comment: 'Test message from Student',
                                                        viewed: false
                                                    }
                                                ]).exec(function ( err, trc ) {
                                                    if ( err ) {
                                                        throw err;
                                                    }

                                                    return cb();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
        else {
            cb();
        }
    });
};
