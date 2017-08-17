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
            if(this.roles.length!=0) {
                return !!this.roles.filter(( role ) => role.name == name)[ 0 ];
            }
            else{
                let hasrole = false;
                let done = false;
                Roles.findOneByName(name).populate('users',{id: this.id}).exec((err,role)=>{
                    if(err) throw err;
                    if(!role) done = true;
                    hasrole = role.users.length==1;
                    done = true;
                });
                require('deasync').loopWhile(()=>{return !done});
                return hasrole;
            }
        }
    }
};

