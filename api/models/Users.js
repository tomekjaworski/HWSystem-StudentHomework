/**
 * Users.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const Users = module.exports = {

    attributes: {

        name: { type: 'string' },

        surname: { type: 'string' },

        album: {
            type: 'string',
            unique: true,
            required: true,
            minLength: 6,
            maxLength: 6
        },

        email: {
            type: 'email'
        },

        password: { type: 'string' },

        salt: { type: 'string' },

        activated: {
            type: 'boolean',
            defaultsTo: true
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
            via: 'students',
            through: 'studentslabgroups'
        },

        subjects: {
            collection: 'subjects',
            via: 'students'
        },

        fullName: function () {
            return this.name + ' ' + this.surname;
        }
    }
};

