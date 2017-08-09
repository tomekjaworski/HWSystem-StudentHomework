/**
 * TestController
 *
 * @description :: Server-side logic for managing Tests
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


    /**
     * `TestController.index()`
     */
    index: function (req, res) {
        return res.view('test/index', {title: 'Testsite'}, function (err, html) {

            // If a view error occured, fall back to JSON(P).
            if (err) {
                //
                // Additionally:
                // • If the view was missing, ignore the error but provide a verbose log.
                if (err.code === 'E_VIEW_FAILED') {
                    sails.log.verbose('res.forbidden() :: Could not locate view for error page (sending JSON instead).  Details: ', err);
                }
                // Otherwise, if this was a more serious error, log to the console with the details.
                else {
                    sails.log.warn('res.forbidden() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ', err);
                }
                return res.jsonx(err);
            }

            return res.send(html);
        });
    },
    second: function (req, res) {
        return res.view('test/second', {title: 'Testsite Loggedin'}, function (err, html) {

            // If a view error occured, fall back to JSON(P).
            if (err) {
                //
                // Additionally:
                // • If the view was missing, ignore the error but provide a verbose log.
                if (err.code === 'E_VIEW_FAILED') {
                    sails.log.verbose('res.forbidden() :: Could not locate view for error page (sending JSON instead).  Details: ', err);
                }
                // Otherwise, if this was a more serious error, log to the console with the details.
                else {
                    sails.log.warn('res.forbidden() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ', err);
                }
                return res.jsonx(err);
            }

            return res.send(html);
        });
    }
};

