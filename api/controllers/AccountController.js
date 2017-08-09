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
                            return res.redirect('/?loginSuccess');
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
        return res.redirect('/');
    },


    /**
     * `AccountController.register()`
     */
    register: function (req, res) {
        return res.json({
            todo: 'register() is not implemented yet!'
        });
    },

    profile: function (req, res){
        return res.json({
            todo: 'register() is not implemented yet!'
        });
    }
};

