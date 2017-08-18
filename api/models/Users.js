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

        labGroups: {
            collection: 'labgroups',
            via: 'student',
            through: 'studentslabgroups'
        },

        fullName: function () {
            return this.name + ' ' + this.surname;
        },

        hasRole: function (name) {
            return !!this.roles.filter((role)=>role.name==name)[0];
        }
    },

    validatePassword: function ( password ) {
        if ( password.length < 8 ) {
            return 1;
        }
        let hasUpperCase = /[A-Z]/.test(password);
        let hasLowerCase = /[a-z]/.test(password);
        let hasNumbers = /\d/.test(password);
        let hasNonalphas = /\W/.test(password);
        if ( hasUpperCase + hasLowerCase + hasNumbers + hasNonalphas < 3 ) {
            return 2;
        }
        return 0;
    }
};

