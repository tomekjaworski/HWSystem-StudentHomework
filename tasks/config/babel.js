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
        // files: [
        //   {
        //     expand: true,
        //     cwd: 'assets/js/',
        //     src: ['*.js'],
        //     dest: '.tmp/public/js/'
        //   }
        // ]
        files: {
          '.tmp/public/js/main.js': 'assets/js/main.js',
          '.tmp/public/js/markdown.js': 'assets/js/markdown.js',
          '.tmp/public/js/task.js': 'assets/js/task.js',
          '.tmp/public/js/teacherReplies.js': 'assets/js/teacherReplies.js',
          '.tmp/public/js/teacherTasksTopics.js': 'assets/js/teacherTasksTopics.js',
          '.tmp/public/js/teacherUsers.js': 'assets/js/teacherUsers.js'
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-babel')
  grunt.registerTask('default', ['babel'])
}
