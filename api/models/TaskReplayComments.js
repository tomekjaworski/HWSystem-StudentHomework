/**
 * TaskReplayComments.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const TaskReplayComments = module.exports = {

    attributes: {

        replay: {model: 'taskreplays'},

        user: {model: 'Users'},

        comment: {type: 'text'},

        viewed: {type: 'boolean'}
    }
};

