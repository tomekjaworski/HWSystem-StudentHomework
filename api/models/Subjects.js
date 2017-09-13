/**
 * Subjects.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const Subjects = module.exports = {

  attributes: {

    name: {type: 'string'},

    desc: {type: 'string'},

    labGroups: {
      collection: 'labgroups',
      via: 'subject'
    },

    topics: {
      collection: 'topics',
      via: 'subject'
    }
  }
}
