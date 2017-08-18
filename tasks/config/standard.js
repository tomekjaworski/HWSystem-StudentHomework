/**
 * `less`
 *
 * ---------------------------------------------------------------
 *
 * Compile your LESS files into a CSS stylesheet.
 *
 * By default, only the `assets/styles/importer.less` is compiled.
 * This allows you to control the ordering yourself, i.e. import your
 * dependencies, mixins, variables, resets, etc. before other stylesheets)
 *
 * For usage docs see:
 *   https://github.com/gruntjs/grunt-contrib-less
 *
 */
module.exports = function (grunt) {
  grunt.config.set('standard', {
    dev: {
      options: {
        fix: false,
        globals: [
          '_',
          'LabGroups',
          'Users',
          'sails',
          'Roles',
          'Topics',
          'Tasks',
          'TaskComments',
          'StudentsLabGroups',
          'StudentsLabGroups',
          'TaskReplies',
          'TaskDescription',
          'Subjects',
          'TaskReplyFiles'
        ]
      },
      app: {
        src: [
          '{,api/controllers/,api/models/,api/policies/,api/responses/,api/services/,assets/js/,assets/js/dependencies/}*.js'
        ]
      }
    }
  })

  grunt.loadNpmTasks('grunt-standard')
}
