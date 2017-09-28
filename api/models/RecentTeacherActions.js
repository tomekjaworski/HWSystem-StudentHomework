/**
 * RecentTeacherActions.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const RecentTeacherActions = module.exports = {

  attributes: {

    type: {type: 'number'},

    student: {model: 'users'},

    task: {model: 'tasks'},

    labgroup: {model: 'labgroups'},

    message: {type: 'string'},

    seen: {
      type: 'boolean',
      defaultsTo: false
    }
  }
}
