/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const crypto = require('crypto');

const AccountController = module.exports = {


    /**
     * `AccountController.login()`
     */
    login: function (req, res) {
        let data = {title: 'Logowanie', error: null}
        switch (req.method) {
            case 'GET':
                break;
            case 'POST':
                let email = req.param('email'), password = req.param('password');
                if(!email && !password){
                    data.error = 'Brak podanych danych';
                    break;
                }
                Users.findByEmail()
                let hash = crypto.createHmac('sha256', secret)
                    .update('I love cupcakes')
                    .digest('hex');
                return res.send("Test");
            default:
                return res.badRequest();
        }

        return res.view('account/login', data, function (err, html) {
            if (err) {
                if (err.code === 'E_VIEW_FAILED') {
                    sails.log.verbose('res.forbidden() :: Could not locate view for error page.  Details: ', err);
                }
                else {
                    sails.log.warn('res.forbidden() :: When attempting to render error page view, an error occured.  Details: ', err);
                }
                return res.jsonx(err);
            }

            return res.send(html);
        });
    },


    /**
     * `AccountController.logout()`
     */
    logout: function (req, res) {
        return res.json({
            todo: 'logout() is not implemented yet!'
        });
    },


    /**
     * `AccountController.register()`
     */
    register: function (req, res) {
        return res.json({
            todo: 'register() is not implemented yet!'
        });
    }
};

