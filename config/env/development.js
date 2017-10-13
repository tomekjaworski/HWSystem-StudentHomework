/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/datastores.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMongodbServer'
  // }

  settings: {
    machine: {
      ip: 'http://localhost',
      port: 1337,
      apiKey: 'alamakota1234'
    }
  },

  datastores: {

    /***************************************************************************
     *                                                                          *
     * Configure your default production database.                              *
     *                                                                          *
     * 1. Choose an adapter:                                                    *
     *    https://sailsjs.com/plugins/databases                                 *
     *                                                                          *
     * 2. Install it as a dependency of your Sails app.                         *
     *    (For example:  npm install sails-mysql --save)                        *
     *                                                                          *
     * 3. Then pass it in, along with a connection URL.                         *
     *    (See https://sailsjs.com/config/datastores for help.)                 *
     *                                                                          *
     ***************************************************************************/
    // default: {
    //   adapter: 'sails-mysql',
    //   url: 'mysql://user:password@host:port/database'
    // }
    // --------------------------------------------------------------------------
    //  /\   To avoid checking it in to version control, you might opt to set
    //  ||   sensitive credentials like `url` using an environment variable.
    //
    //  For example:
    //  ```
    //  sails_datastores__default__url=mysql://admin:myc00lpAssw2D@db.example.com:3306/my_prod_db
    //  ```
    // --------------------------------------------------------------------------

  },

  models: {

    /***************************************************************************
     *                                                                          *
     * To help avoid accidents, Sails automatically sets the automigration      *
     * strategy to "safe" when your app lifts in production mode.               *
     * (This is just here as a reminder.)                                       *
     *                                                                          *
     * More info:                                                               *
     * https://sailsjs.com/docs/concepts/models-and-orm/model-settings#?migrate *
     *                                                                          *
     ***************************************************************************/
    datastore: 'default'

  }

}
