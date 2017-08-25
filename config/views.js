/**
 * View Engine Configuration
 * (sails.config.views)
 *
 * Server-sent views are a classic and effective way to get your app up
 * and running. Views are normally served from controllers.  Below, you can
 * configure your templating language/framework of choice and configure
 * Sails' layout support.
 *
 * For more information on views and layouts, check out:
 * http://sailsjs.org/#!/documentation/concepts/Views
 */

module.exports.views = {

  extension: 'pug',
  layout: false,
  getRenderFn: function () {
    // Import `consolidate`.
    let cons = require('consolidate')
    // Return the rendering function for Swig.
    return cons.pug
  }

}
