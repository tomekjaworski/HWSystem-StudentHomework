/**
 * Topics.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const Topics = module.exports = {

    attributes: {

        number: { type: 'string' },

        title: { type: 'string' },

        visible: {
            type: 'boolean',
            defaultsTo: false
        },

        deadline: { type: 'datetime' },

        tasks: {
            collection: 'tasks',
            via: 'topic'
        },

        customGroupDeadline: {
            collection: 'labgrouptopicdeadline',
            via: 'topic'
        }
    }
};

