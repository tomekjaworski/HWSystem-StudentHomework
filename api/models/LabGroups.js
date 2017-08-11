/**
 * LabGroups.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const LabGroups = module.exports = {

    attributes: {

        name: {type: 'string'},

        subject: {model: 'subjects'},

        message : {type: 'string'},

        owner: {model: 'users'},

        time: {type: 'string'},

        date: {
            type: 'integer',
            enum: [0, 1, 2, 3, 4, 5, 6]
        },

        students: {
            collection: 'users',
            via: 'labGroups',
            through: 'studentslabgroups'
        }
    }
};

