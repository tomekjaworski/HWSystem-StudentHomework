/**
 * `standard`
 *
 * ---------------------------------------------------------------
 *
 * Check standard compliance
 *
 */
module.exports = function (grunt) {
  grunt.config.set('standard', {
    dev: {
      options: {
        fix: true,
        globals: [
          '$',
          '_',
          'hljs',
          'jsLocale',
          'LabGroups',
          'LabGroupTopicDeadline',
          'ManageReplies',
          'MySqlFile',
          'RecentAction',
          'RecentTeacherActions',
          'RecentStudentActions',
          'Roles',
          'sails',
          'SimpleMDE',
          'Sortable',
          'StudentCustomDeadlines',
          'StudentsLabGroups',
          'StudentsLabGroups',
          'Subjects',
          'TaskComments',
          'TaskDescription',
          'TaskReplies',
          'TaskReplyFileContent',
          'TaskReplyFiles',
          'Tasks',
          'Topics',
          'TopicsAndTasksController',
          'CustomCodes',
          'Users'
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
