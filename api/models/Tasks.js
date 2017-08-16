/**
 * Tasks.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const Tasks = module.exports = {

    attributes: {

        number: { type: 'string' },

        title: { type: 'string' },

        visible: {
            type: 'boolean',
            defaultsTo: false
        },

        description: { model: 'taskdescription' },

        replies: {
            collection: 'taskreplies',
            via: 'task'
        },

        topic: { model: 'topics' }
    }
};

