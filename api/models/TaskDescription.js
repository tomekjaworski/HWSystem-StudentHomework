/**
 * TaskDescription.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const TaskDescription = module.exports = {

    attributes: {

        task: { model: 'tasks' },

        description: { type: 'longtext' }
    }
};

