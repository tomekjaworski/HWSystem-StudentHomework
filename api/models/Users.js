/**
 * Users.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const Users = module.exports = {

    attributes: {

        name: {type: 'string'},

        surname: {type: 'string'},

        email: {
            type: 'email'
        },

        password: {type: 'string'},

        salt: {type: 'string'},

        activated: {
            type: 'boolean',
            default: false
        },

        roles: {
            collection: 'roles',
            via: 'users'
        },

        deanGroups: {
            collection: 'deangroups',
            via: 'students'
        },

        labGroups: {
            collection: 'labgroups',
            via: 'students'
        },

        subjects: {
            collection: 'subjects',
            via: 'students'
        },

        fullName: function(){
            return this.name + ' ' + this.surname;
        }
    }
};

