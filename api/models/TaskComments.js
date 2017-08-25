/**
 * TaskComments.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const TaskComments = module.exports = {

  attributes: {

    task: {
      model: 'tasks'
    },

    taskStudent: {model: 'users'},

    user: {model: 'users'},

    comment: {type: 'string',
    columnType: 'text'},

    viewed: {
      type: 'boolean',
      defaultsTo: false
    }
  }
}
