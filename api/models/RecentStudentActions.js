/**
 * RecentStudentActions.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const RecentStudentActions = module.exports = {

  attributes: {

    type: {type: 'number'},

    student: {model: 'users'},

    teacher: {model: 'users'},

    task: {model: 'tasks'},

    data: {type: 'string'},

    meta: {type: 'number'},

    seen: {
      type: 'boolean',
      defaultsTo: false
    }
  }
}
