/**
 * TaskReplays.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const TaskReplies = module.exports = {

  attributes: {

    student: {model: 'users'},

    task: {model: 'tasks'},

    files: {
      collection: 'taskreplyfiles',
      via: 'reply'
    },

    teacherStatus: {
      type: 'integer',
      enum: [0, 1, 2],
      defaultsTo: 0
    },

    machineStatus: {
      type: 'integer',
      enum: [0, 1, 2, 3],
      defaultsTo: 0
    },

    blocked: {
      type: 'boolean',
      defaultsTo: false
    }
  }
}
