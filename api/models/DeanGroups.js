/**
 * DeanGroups.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const DeanGroups = module.exports = {

    attributes: {

        name: { type: 'string' },

        desc: { type: 'string' },

        owner: { model: 'users' },

        students: {
            collection: 'users',
            via: 'deanGroups'
        }
    }
};

