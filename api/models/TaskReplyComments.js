/**
 * TaskReplayComments.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const TaskReplyComments = module.exports = {

    attributes: {

        reply: {
            model: 'taskreplies'
        },

        user: { model: 'users' },

        comment: { type: 'text' },

        viewed: {
            type: 'boolean',
            defaultsTo: false
        }
    }
};

