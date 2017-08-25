/**
 * StudentCustomDeadlines.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const StudentCustomDeadlines = module.exports = {

  attributes: {

    student: {model: 'users'},

    task: {model: 'tasks'},

    deadline: {type: 'number'}
  }
}
