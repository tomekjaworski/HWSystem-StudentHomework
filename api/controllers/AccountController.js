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
                return res.view('account/login', { title: 'Logowanie' });
                break;
            case 'POST':
                let email = req.param('email'), password = req.param('password');
                if ( !_.isString(email) || !_.isString(password) ) {
                    return AccountController.loginError(res, 'Źle wporwadzone dane');
                }
                Users.findOneByEmail(email).exec(function ( err, user ) {
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
                        if ( _.isString(req.param('redirect')) ) {
                            return res.redirect(req.param('redirect'));
                        }
                        else {
                            return res.redirect('/account');
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
                DeanGroups.find({}).exec(function ( err, dean ) {
                    LabGroups.find({}).populate('owner').exec(function ( err, labs ) {
                        return res.view('account/register', { title: 'Rejestracja', dea: dean, labs: labs });
                    });
                });
                break;
            case 'POST':
                let name = req.param('name'), album = req.param('album'), surname = req.param('surname'),
                    email = req.param('email'), password = req.param('password'), repassword = req.param('repassword');
                let deangroups = req.param('groupd'), labgroups = req.param('groupl');
                let st = crypto.randomBytes(20).toString('hex');
                if ( !name && !surname && !email && !password ) {
                    return AccountController.registerError(res, 'Proszę uzupełnić wszystkie pola.');
                }
                let regexEmail = /^\w+@(p\.lodz\.pl)|\w+@(edu\.p\.lodz\.pl)$/;
                if ( !regexEmail.test(email) ) {
                    return AccountController.registerError(res, 'Rejestracja dostępna tylko z uczelnienych maili');
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
                    DeanGroups.findOneByName(deangroups).exec(function ( err, dean ) {
                        if ( err ) {
                            res.jsonx(err);
                        }
                        LabGroups.findOneByName(labgroups).exec(function ( err, lab ) {
                            if ( err ) {
                                res.jsonx(err);
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
                                deanGroups: [ dean ],
                                labGroups: [ lab ]
                            }).exec(function ( err ) {
                                if ( err ) {
                                    return res.serverError(err);
                                }

                                return res.redirect('/login?registerSuccess');
                            });
                        });

                    });

                });

        }
    },

    index: function ( req, res ) {
        StudentsLabGroups.findOne({ student: req.localUser.id/*, active: true*/ }).populate('labgroup')
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
                    'WHERE topics.group = ?\n' +
                    'GROUP BY topics.id', [ lab.id ], ( err, data ) => {
                    if ( err ) {
                        return res.serverError(err);
                    }
                    let ret = { message: lab.message, topics: data };
                    //console.log(ret);
                    return res.view('account/index', { data: ret });

                });
            });
    }
};

