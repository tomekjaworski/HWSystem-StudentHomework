/**
 * TaskReplayFiles.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const TaskReplyFiles = module.exports = {

  attributes: {

    reply: {model: 'taskreplies'},

    fileName: {type: 'string'},

    fileSize: {type: 'number'},

    fileExt: {type: 'string'},

    fileMimeType: {type: 'string'},

    file: {
      model: 'taskreplyfilecontent'
    },

    visible: {
      type: 'boolean',
      defaultsTo: true
    }
  }
}
