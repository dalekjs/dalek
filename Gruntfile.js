module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({

    watch: {},

    lint: {},

    jshint: {
      options: {}
    }
  });

  grunt.registerTask('test', 'nodeunit');
};
