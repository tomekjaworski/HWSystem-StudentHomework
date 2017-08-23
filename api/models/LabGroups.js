/**
 * LabGroups.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const LabGroups = module.exports = {

  attributes: {

    name: {type: 'string',
      unique: true},

    description: {type: 'string'},

    subject: {model: 'subjects'},

    message: {type: 'string'},

    active: {type: 'boolean',
      defaultsTo: true},

    owner: {model: 'users'},

    customDeadlines: {
      collection: 'labgrouptopicdeadline',
      via: 'group'
    },

    students: {
      collection: 'users',
      via: 'labgroup',
      through: 'studentslabgroups'
    }
  }
}
