module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({

    jshint: {
      options: {
        jsintrc: '.jshintrc'
      },
      all: ['Gruntfile.js', 'test/*.js', 'lib/*.js']
    },

    nodeunit: {
      all: ['test/*_TEST.js']
    },


    watch: {
      all: ['Gruntfile.js', 'test/*.js', 'lib/*.js']
    },
  });

  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.registerTask('test', 'nodeunit');
  grunt.registerTask('lint', 'jshint');
};
