/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */

module.exports.models = {

  /***************************************************************************
   *                                                                          *
   * Your app's default connection. i.e. the name of one of your app's        *
   * connections (see `config/datastores.js`)                                *
   *                                                                          *
   ***************************************************************************/
  // datastore: 'default',

  /***************************************************************************
   *                                                                          *
   * How and whether Sails will attempt to automatically rebuild the          *
   * tables/collections/etc. in your schema.                                  *
   *                                                                          *
   * See http://sailsjs.org/#!/documentation/concepts/ORM/model-settings.html  *
   *                                                                          *
   ***************************************************************************/
  migrate: 'safe',

  attributes: {
    createdAt: {type: 'number', autoCreatedAt: true},
    updatedAt: {type: 'number', autoUpdatedAt: true},
    id: {type: 'number', autoIncrement: true}
  }

}
