/**
 * 400 (Bad Request) Handler
 *
 * Usage:
 * return res.badRequest();
 * return res.badRequest(data);
 * return res.badRequest(data, 'some/specific/badRequest/view');
 *
 * e.g.:
 * ```
 * return res.badRequest(
 *   'Please choose a valid `password` (6-12 characters)',
 *   'trial/signup'
 * );
 * ```
 */

module.exports = function badRequest (data, options) {
  // Get access to `req`, `res`, & `sails`
  let req = this.req
  let res = this.res
  let sails = req._sails

  // Set status code
  res.status(400)

  // Log error to console
  if (data !== undefined) {
    sails.log.verbose('Sending 400 ("Bad Request") response: \n', data)
  } else {
    sails.log.verbose('Sending 400 ("Bad Request") response')
  }

  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.
  if (sails.config.environment === 'production' && sails.config.keepResponseErrors !== true) {
    data = undefined
  }

  // If the user-agent wants JSON, always respond with JSON
  // If views are disabled, revert to json
  if (req.wantsJSON || sails.config.hooks.views === false) {
    return res.jsonx(data)
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  options = (typeof options === 'string') ? {view: options} : options || {}

  // Attempt to prettify data for views, if it's a non-error object
  let viewData = data
  if (!(viewData instanceof Error) && typeof viewData === 'object') {
    try {
      viewData = require('util').inspect(data, {depth: null})
    } catch (e) {
      viewData = undefined
    }
  }

  // If a view was provided in options, serve it.
  // Otherwise try to guess an appropriate view, or if that doesn't
  // work, just send JSON.
  if (options.view) {
    return res.view(options.view, {data: viewData, title: 'Bad Request'})
  } else {
    // If no second argument provided, try to serve the implied view,
    // but fall back to sending JSON(P) if no view can be inferred.
    return res.view('400', {data: viewData, title: 'Bad Request'}, function (err, html) {
      // If a view error occured, fall back to JSON(P).
      if (err) {
        //
        // Additionally:
        // • If the view was missing, ignore the error but provide a verbose log.
        if (err.code === 'E_VIEW_FAILED') {
          sails.log.verbose(
            'res.badRequest() :: Could not locate view for error page (sending JSON instead).  Details: ',
            err)
        } else {
          // Otherwise, if this was a more serious error, log to the console with the details.
          sails.log.warn(
            'res.badRequest() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ',
            err)
        }
        return res.jsonx(data)
      }

      return res.send(html)
    })
  }
}
