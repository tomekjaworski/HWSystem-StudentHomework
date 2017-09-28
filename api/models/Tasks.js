/**
 * Tasks.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const Tasks = module.exports = {

  attributes: {

    number: {type: 'string'},

    title: {type: 'string'},

    visible: {
      type: 'boolean',
      defaultsTo: false
    },

    description: {
      collection: 'taskdescription',
      via: 'task'
    },

    arduino: {
      type: 'boolean',
      defaultsTo: false
    },

    computer: {
      type: 'boolean',
      defaultsTo: false
    },

    replies: {
      collection: 'taskreplies',
      via: 'task'
    },

    topic: {model: 'topics'},

    customDeadline: {
      collection: 'studentcustomdeadlines',
      via: 'task'
    },

    comments: {
      collection: 'taskcomments',
      via: 'task'
    }
  }
}
