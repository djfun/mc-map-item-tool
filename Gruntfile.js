/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    casperjs: {
      options: {
        async: {
          parallel: false
        }
        /*,
        casperjsOptions: ['--log-level=debug', '--verbose', '--web-security=no']*/
      },
      files: ['tests/yadda/main_test.js']
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-casperjs');

  // Default task.
  grunt.registerTask('test', ['casperjs']);

};