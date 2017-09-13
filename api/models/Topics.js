/**
 * Topics.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const Topics = module.exports = {

  attributes: {

    number: {type: 'string'},

    title: {type: 'string'},

    subject: {model: 'subjects'},

    visible: {
      type: 'boolean',
      defaultsTo: false
    },

    deadline: {type: 'number'},

    tasks: {
      collection: 'tasks',
      via: 'topic'
    },

    customGroupDeadline: {
      collection: 'labgrouptopicdeadline',
      via: 'topic'
    }
  }
}
