/**
 * Users.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* eslint-disable no-unused-vars */
// noinspection JSUnusedLocalSymbols
const Users = module.exports = {

  attributes: {

    name: {type: 'string'},

    surname: {type: 'string'},

    album: {
      type: 'string',
      unique: true,
      allowNull: true,
      minLength: 6,
      maxLength: 6
    },

    isTeacher: {
      type: 'boolean',
      defaultsTo: false
    },

    isAdmin: {
      type: 'boolean',
      defaultsTo: false
    },

    email: {
      unique: true,
      type: 'string',
      isEmail: true
    },

    password: {type: 'string'},

    salt: {type: 'string'},

    activated: {
      type: 'boolean',
      defaultsTo: true
    },

    labGroups: {
      collection: 'labgroups',
      via: 'student',
      through: 'studentslabgroups'
    },
    languagePreference: {
      type: 'string',
      defaultsTo: 'pl'
    },
    nightMode: {
      type: 'boolean',
      defaultsTo: false
    },
    chatMode: {
      type: 'number',
      defaultsTo: 0
    }

    // fullName: function () {
    //   return this.name + ' ' + this.surname
    // },
    //
    // hasRole: function (name) {
    //   if (this.roles.length !== 0) {
    //     return !!this.roles.filter((role) => role.name === name)[0]
    //   } else {
    //     let hasrole = false
    //     let done = false
    //     Roles.findOneByName(name).populate('users', {id: this.id}).exec((err, role) => {
    //       if (err) throw err
    //       if (!role) done = true
    //       hasrole = role.users.length === 1
    //       done = true
    //     })
    //     require('deasync').loopWhile(() => { return !done })
    //     return hasrole
    //   }
    // }
  },

  methods: {
    fullName: function (inverse) {
      if (this.name && this.surname) {
        if (!inverse) {
          return this.name + ' ' + this.surname
        } else {
          return this.surname + ' ' + this.name
        }
      }
      return null
    }
  },

  validatePassword: function (password) {
    if (password.length < 8) {
      return 1
    }
    let hasUpperCase = /[A-Z]/.test(password)
    let hasLowerCase = /[a-z]/.test(password)
    let hasNumbers = /\d/.test(password)
    let hasNonalphas = /\W/.test(password)
    if (hasUpperCase + hasLowerCase + hasNumbers + hasNonalphas < 3) {
      return 2
    }
    return 0
  }
}
