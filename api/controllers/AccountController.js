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
    loginError: function(res, err){
        return res.view('account/login', {title: 'Logowanie', error: err});
    },

    /**
     * @description     :: Hash password with given salt
     * @param password  :: Password to hash
     * @param salt      :: Salt to hash password
     * @returns {*}     :: Hashed password
     */
    hashPassword: function(password, salt){
        return crypto.createHmac('sha256', salt)
            .update(password, 'utf8').digest('hex');
    },

    generateSalt: function () {
        crypto.randomBytes(20).toString('hex');
    },

    /**
     *
     * @param res
     * @param err
     */

    registerError: function(res, err){
        return res.view('account/registration', {title: 'Rejestracja', error: err});
    },


    // Controller Actions

    /**
     * `AccountController.login()`
     */
    login: function (req, res) {
        if(req.session.authed)
            return res.redirect('/');
        switch (req.method) {
            case 'GET':
                return res.view('account/login', {title: 'Logowanie'});
                break;
            case 'POST':
                let email = req.param('email'), password = req.param('password');
                if(!_.isString( email ) || !_.isString( password )){
                    return AccountController.loginError(res, 'Źle wporwadzone dane')
                }
                Users.findOneByEmail(email).exec(function(err,user){
                    if(err)
                        return res.jsonx(err);
                    if(!user){
                        return AccountController.loginError(res, 'Błędna kombinacja użytkownika i hasła');
                    }
                    if(user.password === AccountController.hashPassword(password,user.salt)){
                        if(!user.activated){
                            return AccountController.loginError(res, 'Konto nie jest aktywne');
                        }
                        req.session.authed=user.id;
                        if(_.isString( req.param('redirect') )){
                            return res.redirect(req.param('redirect'));
                        }
                        else {
                            return res.redirect('/account');
                        }
                    }
                    else{
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
    logout: function (req, res) {
        if(req.session.authed){
            req.session.authed = null;
        }
        return res.redirect('/login');
    },



    /**
     * `AccountController.register()`
     */
    register: function (req, res) {

        switch (req.method) {
            case 'GET':
                DeanGroups.find({}).exec(function (err, dean) {
                    return res.view('account/register', {title: 'Rejestracja', dea: dean});
                });
                break;
            case 'POST':
                let name = req.param('name'), album=req.param('album'), surname = req.param('surname'),
                    email = req.param('email'), password = req.param('password'), repassword = req.param('repassword');
                let deangroups = req.param('deangroups'), labgroups = req.param('labgroups'),
                    subjects = req.param('subjects');
                let st =crypto.randomBytes(20).toString('hex');
                if (!name && !surname && !email && !password) {
                    return AccountController.registerError(res, 'Proszę uzupełnić wszystkie pola.');
                }
                if(password !== repassword){
                    return AccountController.registerError(res, 'Hasła nie są identyczne');
                }
                Roles.findOneByName('student').exec(function (err, role) {
                    if (err){
                        return jsonx(err)
                    }
                    DeanGroups.find({}).exec(function (err, dean) {

                        Users.create({
                            name: name,
                            surname: surname,
                            album: album,
                            email: email,
                            password: AccountController.hashPassword(password, st),
                            salt: st,
                            activated: true,
                            roles: role,
                            deanGroups: dean,
                        }).exec(function (err) {
                            if (err) {
                                return res.serverError(err);
                            }

                            return res.redirect('/login?registerSuccess');
                        });

                    });
                });
        }
    },

    index: function (req, res){
        return res.view('account/index');
    }
};

