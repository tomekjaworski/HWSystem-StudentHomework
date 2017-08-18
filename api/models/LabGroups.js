/**
 * LabGroups.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const LabGroups = module.exports = {

  attributes: {

    name: {type: 'string'},

    subject: {model: 'subjects'},

    message: {type: 'string'},

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
