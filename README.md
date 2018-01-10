# HW System
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

a [Sails](http://sailsjs.org) application

## External Dependencies
 - Node.js v8.9.x or above
 - Pandoc: https://github.com/jgm/pandoc/releases/tag/2.1
 - Ruby-SASS compiler
 - a Redis session store
 - a MySQL datastore

## Installation and configuration
 - Clone the repository
 - Install dependencies with `npm install`
 - After dependencies are done installing proceed to `node_modules/waterline/lib/waterline/utils/query/proccess-all-records.js` and add the following code on (currently) line 536 "Custom .toJSON":
   ```
   if (WLModel.methods) {
     Object.assign(record, WLModel.methods)
   }
   ```
 - Configure database connection in `config/datastores.js`
 - Configure session store connection in `config/session.js`
 - **For development**:
    - To create a dummy database, proceed to `config/models.js` and switch `migrate` from *safe* to *alter*
    - Switch it back to *safe* to for faster startup times after the dummy db is done seeding.

## Running and testing for code style errors:
App listens on port **1337** by default
 - Starting up
    - `npm start`
 - Starting in production mode
    - `NODE_ENV=production npm start`
 - Testing for code style and automatically fix some errors
    - `npm test`

In memoriam of David 'SkeraDev' Sadko
