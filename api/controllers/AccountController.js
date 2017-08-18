/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const crypto = require('crypto');

const AccountController = module.exports = {


    // Static functions

    /**
     * @description :: Render login page with error
     * @param res   :: Response object
     * @param err   :: Error message
     */
    loginError: function ( res, err ) {
        return res.view('account/login', { title: 'Logowanie', error: err });
    },

    /**
     * @description     :: Hash password with given salt
     * @param password  :: Password to hash
     * @param salt      :: Salt to hash password
     * @returns {*}     :: Hashed password
     */
    hashPassword: function ( password, salt ) {
        return crypto.createHmac('sha256', salt)
            .update(password, 'utf8').digest('hex');
    },

    generateSalt: function () {
        crypto.randomBytes(20).toString('hex');
    },

    /**
     *
     * @param res
     * @param error
     */

    registerError: function ( res, error ) {
        DeanGroups.find({}).exec(function ( err, dean ) {
            LabGroups.find({}).populate('owner').exec(function ( err, labs ) {
                return res.view('account/register', { title: 'Rejestracja', dea: dean, labs: labs, error: error });
            });
        });
    },


    // Controller Actions

    /**
     * `AccountController.login()`
     */
    login: function ( req, res ) {
        if ( req.session.authed ) {
            return res.redirect('/');
        }
        switch ( req.method ) {
            case 'GET':
                return res.view('account/login', { title: 'Logowanie', redirect: req.param('redirect') });
                break;
            case 'POST':
                let email = req.param('email'), password = req.param('password'), red = req.param('redirect');
                if ( !_.isString(email) || !_.isString(password) ) {
                    return AccountController.loginError(res, 'Źle wporwadzone dane');
                }
                Users.findOneByEmail(email).populate('roles').exec(function ( err, user ) {
                    if ( err ) {
                        return res.jsonx(err);
                    }
                    if ( !user ) {
                        return AccountController.loginError(res, 'Błędna kombinacja użytkownika i hasła');
                    }
                    if ( user.password === AccountController.hashPassword(password, user.salt) ) {
                        if ( !user.activated ) {
                            return AccountController.loginError(res, 'Konto nie jest aktywne');
                        }
                        req.session.authed = user.id;
                        if ( _.isString(red) ) {
                            return res.redirect(red);
                        }
                        else {
                            if(user.hasRole('teacher')){
                                return res.redirect(sails.getUrlFor('TeacherController.index'));
                            }
                            return res.redirect(sails.getUrlFor('AccountController.index'));
                        }
                    }
                    else {
                        return AccountController.loginError(res, 'Błędna kombinacja użytkownika i hasła');
                    }

                });
                break;
            default:
                return res.badRequest();
        }
    },


    /**
     * `AccountController.logout()`
     */
    logout: function ( req, res ) {
        if ( req.session.authed ) {
            req.session.authed = null;
        }
        return res.redirect('/login');
    },


    /**
     * `AccountController.register()`
     */
    register: function ( req, res ) {

        switch ( req.method ) {
            case 'GET':
                LabGroups.find({}).populate('owner').exec(function ( err, labs ) {
                    return res.view('account/register', { title: 'Rejestracja', labs: labs });
                });
                break;
            case 'POST':
                let name = req.param('name'), album = req.param('album'), surname = req.param('surname'),
                    email = req.param('email'), password = req.param('password'), repassword = req.param('repassword');
                let labgroups = req.param('groupl');
                let st = crypto.randomBytes(20).toString('hex');
                if ( !name && !surname && !email && !password ) {
                    return AccountController.registerError(res, 'Proszę uzupełnić wszystkie pola.');
                }
                let regexEmail = /^\w+@(p\.lodz\.pl)|\w+@(edu\.p\.lodz\.pl)$/;
                if ( !regexEmail.test(email) ) {
                    return AccountController.registerError(res, 'Rejestracja dostępna tylko z uczelnienych maili');
                }
                if ( album.length != 6 ) {
                    return AccountController.registerError(res, 'Numer albumu jest nieprawidłowy.');
                }
                if ( password !== repassword ) {
                    return AccountController.registerError(res, 'Hasła nie są identyczne');
                }
                if ( password.length < 8 ) {
                    return AccountController.registerError(res, 'Hasło jest za krótkie. Powinno zawierać 8 znaków.');
                }
                let hasUpperCase = /[A-Z]/.test(password);
                let hasLowerCase = /[a-z]/.test(password);
                let hasNumbers = /\d/.test(password);
                let hasNonalphas = /\W/.test(password);
                if ( hasUpperCase + hasLowerCase + hasNumbers + hasNonalphas < 3 ) {
                    return AccountController.registerError(res, 'Twoje hasło powinno zawierać dużą i małą litere');
                }

                //TODO: sprawdzic Dean & Lab
                Roles.findOneByName('student').exec(function ( err, role ) {
                    if ( err ) {
                        return jsonx(err);
                    }

                    LabGroups.findOneByName(labgroups).exec(function ( err, lab ) {
                        if ( err ) {
                            res.jsonx(err);
                        }
                        if ( !lab ) {
                            return AccountController.registerError(res, 'Nieprawidłowa grupa laboratoryjna.');
                        }
                        Users.create({
                            name: name,
                            surname: surname,
                            album: album,
                            email: email,
                            password: AccountController.hashPassword(password, st),
                            salt: st,
                            activated: true,
                            roles: role,
                            labGroups: [ lab ]
                        }).exec(function ( err ) {
                            if ( err ) {
                                return res.serverError(err);
                            }

                            return res.redirect(sails.getUrlFor('AccountController.login'));
                        });
                    });

                });

        }
    },

    index: function ( req, res ) {
        if ( req.localUser.hasRole('student') ) {
            StudentsLabGroups.findOne({ student: req.localUser.id/*TODO: , active: true*/ }).populate('labgroup')
                .exec(function ( err, lab ) {
                    if ( err ) {
                        return res.serverError(err);
                    }

                    Topics.query('SELECT topics.id topicId, topics.number topicNumber, topics.title topicTitle, topics.deadline topicDeadline, \n' +
                        '    COUNT(tasks.id) taskCount, COUNT(replies.id) repliesCount, sum(case when replies.teacherStatus = 1 then 1 else 0 end) repliesTeacherAccepted,\n' +
                        '    sum(case when replies.teacherStatus = 2 then 1 else 0 end) repliesTeacherRejected,\n' +
                        '    sum(case when replies.blocked = 1 then 1 else 0 end) repliesBlocked,\n' +
                        '    COUNT(DISTINCT comments.reply) repliesCommented,\n' +
                        '    sum(case when replies.machineStatus = 2 then 1 else 0 end) repliesMachineAccepted,\n' +
                        '    sum(case when replies.machineStatus = 3 then 1 else 0 end) repliesMachineRejected,\n' +
                        '    sum(case when replies.machineStatus = 2 and replies.teacherStatus = 1 then 1 else 0 end) repliesAccepted\n' +
                        '    FROM topics\n' +
                        'LEFT JOIN tasks ON tasks.topic = topics.id\n' +
                        'LEFT JOIN taskreplies AS replies ON replies.task = tasks.id\n' +
                        'LEFT JOIN taskreplycomments AS comments ON replies.id = comments.reply\n' +
                        'GROUP BY topics.id', ( err, data ) => {
                        if ( err ) {
                            return res.serverError(err);
                        }
                        let ret = { message: lab.labgroup.message, topics: data };
                        let taskView = parseInt(req.param('topicid'));
                        if ( !isNaN(taskView) ) {
                            ret.taskView = taskView;
                        }
                        return res.view('account/index', { data: ret });
                    });
                });
        }
        else {
            return res.redirect(sails.getUrlFor('TeacherController.index'));
        }
    },

    tasks: function ( req, res ) {
        if ( req.localUser.hasRole('student') ) {
            StudentsLabGroups.findOne({ student: req.localUser.id/*TODO: , active: true*/ })
                .exec(function ( err, lab ) {
                    if ( err ) {
                        return res.serverError(err);
                    }
                    let topicId = req.param('id');
                    Topics.count({'id':topicId}, (err,count)=>{
                        if ( err ) {
                            return res.serverError(err);
                        }
                        if(count!=1){
                            return res.notFound();
                        }
                        Tasks.query('SELECT tasks.id, tasks.number, tasks.title,\n' +
                            '(case when reply.id IS NOT NULL then 1 else 0 end) hasReply,\n' +
                            '(case when comments.reply IS NOT NULL then 1 else 0 end) hasComments,\n' +
                            '(case when reply.id IS NOT NULL then reply.teacherStatus else 0 end) teacherStatus,\n' +
                            '(case when reply.id IS NOT NULL then reply.machineStatus else 0 end) machineStatus,\n' +
                            '(case when scd.task IS NOT NULL then scd.deadline else\n' +
                            '\t(case when groupdeadline.deadline IS NOT NULL then groupdeadline.deadline else topics.deadline end)\n' +
                            ' end) deadline\n' +
                            'FROM tasks\n' +
                            'LEFT JOIN taskreplies reply ON reply.task = tasks.id AND reply.student = ?\n' +
                            'LEFT JOIN taskreplycomments comments ON comments.reply = reply.id AND comments.viewed = false\n' +
                            'LEFT JOIN topics ON topics.id = tasks.topic\n' +
                            '\n' +
                            'LEFT JOIN studentcustomdeadlines scd ON scd.task = tasks.id AND scd.student = ?\n' +
                            'LEFT JOIN labgrouptopicdeadline groupdeadline ON groupdeadline.group = ?\n' +
                            'WHERE tasks.topic = ?\n' +
                            'GROUP BY tasks.id, reply.id, tasks.topic, scd.deadline, groupdeadline.deadline',
                            [ req.localUser.id, req.localUser.id, lab.labgroup, topicId ], ( err, data ) => {
                                if ( err ) {
                                    return res.serverError(err);
                                }
                                return res.json(data);
                            });
                    });
                });
        }
        else {
            return res.badRequest();
        }
    },
    task: function ( req, res ) {
        switch ( req.method ) {
            case 'GET':

                let topicparam = req.param('topicid'), taskparam = req.param('taskid');


                Topics.findOneById(topicparam).exec(function ( err, topic ) {
                    if ( err ) {
                        return res.badRequest(err);
                    }

                    if ( !topic ) {
                        return res.notFound();
                    }

                    Tasks.findOneById(taskparam).populate('description').exec(function ( err, task ) {
                        if ( err ) {
                            return res.badRequest(err);
                        }

                        if ( !task ) {
                            return res.notFound();
                        }

                        task.description = task.description[ 0 ].description;

                        TaskReplies.findOne({ student: req.localUser.id, task: task.id })
                            .exec(function ( err, taskReply ) {
                                if ( err ) {
                                    return res.badRequest(err);
                                }
                                if ( !taskReply ) {
                                    return res.view('account/task',
                                        { topic: topic, task: task, taskReply: taskReply, taskComments: null });
                                }
                                TaskReplyComments.find({ reply: taskReply.id, user: req.localUser.id })
                                    .populate('user').exec(function ( err, taskComments ) {
                                    if ( err ) {
                                        return res.badRequest(err);
                                    }


                                    return res.view('account/task', {
                                        topic: topic,
                                        task: task,
                                        taskReply: taskReply,
                                        taskComments: taskComments
                                    });

                                });

                            });

                    });

                });
                break;

            case 'POST':

                let taskReply= req.param('taskReply'), comment = req.param('comment');

                // Ajax
                TaskReplies.count({id: taskReply, student: req.localUser.id}, (err, count)=>{
                    if(err) return res.serverError(err);
                    if( count === 0 ){
                        return res.forbidden();
                    }
                    TaskReplyComments.update({ reply: taskReply, user:req.localUser.id, viewed:false },{viewed:true}).exec(function (err ) {
                        if (err){
                            return console.log(err);
                        }
                    });
//TODO: Sprawdzanie ajaxowe komentarzy
//                     TaskReplyComments.create({ reply:taskReply, user:req.localUser.id,  comment:comment, viewed:false }).exec(function ( err, comment ) {
//
//
//                     });

                });
                // Dodawanie komentarzy


        }
    },

    userSettings: function ( req, res ) {
        switch (req.method){
            case 'GET':

                Users.findOneById(req.localUser.id).exec(function(err, user){
                    if (err){
                        return json(err);
                    }
                    LabGroups.find().populate('owner').exec(function(err, labs){
                       if (err){
                           return json(err);
                       }

                       return res.view('account/settings', {user: user, labs:labs});
                    });

                });

            case 'POST':
                let password = req.param('password'), repassword = req.param('repassword'), lab = req.param('lab');

        }
    }
};

