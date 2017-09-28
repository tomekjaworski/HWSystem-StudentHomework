/**
 * TaskReplays.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const TaskReplies = module.exports = {

  attributes: {

    student: {model: 'users'},

    task: {model: 'tasks'},

    sent: {
      type: 'boolean',
      defaultsTo: false,
    },

    lastSent: {
      type: 'boolean',
      defaultsTo: false,
    },

    newest: {
      type: 'boolean',
      defaultsTo: true,
    },

    firstId: {
      type: 'number',
    },

    count: {
      type: 'number',
      defaultsTo: 1
    },

    files: {
      collection: 'taskreplyfiles',
      via: 'reply'
    },

    teacherStatus: {
      type: 'number',
      min: 0,
      max: 2,
      defaultsTo: 0
    },

    machineTestId: {
      type: 'number'
    },

    machineStatus: {
      type: 'number',
      min: 0,
      max: 5,
      defaultsTo: 0
    },

    machineOk: {
      type: 'number',
      min: 0,
      max: 2,
      defaultsTo: 0
    },

    machineRaport: {
      type: 'string'
    },

    machineMessage: {
      type: 'string'
    },

    blocked: {
      type: 'boolean',
      defaultsTo: false
    }
  }
}
