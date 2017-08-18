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

  grunt.initConfig({
    babel: {
      options: {
        presets: ['env']
      },
      dist: {
        files: {
          '.tmp/public/js/main.js': 'assets/js/main.js'
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-babel')
  grunt.registerTask('default', ['babel'])
}