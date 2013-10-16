module.exports = function(grunt) {
  'use strict';

  // check task runtime
  require('time-grunt')(grunt);

  // load generic configs
  var configs = require('dalek-build-tools');

  // project config
  grunt.initConfig({

    // load module meta data
    pkg: grunt.file.readJSON('package.json'),

    // define a src set of files for other tasks
    src: {
      lint: ['Gruntfile.js', 'index.js', 'test/*.js'],
      complexity: ['index.js'],
      test: ['test/*.js'],
      src: ['index.js']
    },

    // clean automatically generated helper files & docs
    clean: configs.clean,

    // speed up build by defining concurrent tasks
    concurrent: configs.concurrent,

    // linting
    jshint: configs.jshint,

    // testing
    mochaTest: configs.mocha,

    // code metrics
    complexity: configs.complexity,
    plato: configs.plato(grunt.file.readJSON('.jshintrc')),

    // api docs
    yuidoc: configs.yuidocs(),

    // up version, tag & commit
    bump: configs.bump({
      pushTo: 'git@github.com:dalekjs/dalek.git',
      files: ['package.json', 'CONTRIBUTORS.md', 'CHANGELOG.md']
    }),

    // generate contributors file
    contributors: configs.contributors,

    // compress artifacts
    compress: configs.compress,

    // prepare files for grunt-plato to
    // avoid error messages (weird issue...)
    preparePlato: {
      options: {
        folders: [
          'coverage',
          'report',
          'report/coverage',
          'report/complexity',
          'report/complexity/files',
          'report/complexity/files/index_js'
        ],
        files: [
          'report.history.json',
          'files/index_js/report.history.json'
        ]
      }
    },

    // prepare files & folders for coverage
    prepareCoverage: {
      options: {
        folders: ['coverage', 'report', 'report/coverage'],
        pattern: '[require("fs").realpathSync(__dirname + "/../index.js")]'
      }
    },

    // list requires that need to be changed
    // for generating a canary build
    releaseCanary: {
      options: {
        files: ['index.js']
      }
    }

  });

   // load 3rd party tasks
   require('load-grunt-tasks')(grunt);
+  grunt.loadTasks('./node_modules/dalek-build-tools/tasks');
 
   // define runner tasks
   grunt.registerTask('lint', 'jshint');
+
+  // split test & docs for speed
   grunt.registerTask('test', ['clean:coverage', 'prepareCoverage', 'concurrent:test', 'generateCoverageBadge']);
   grunt.registerTask('docs', ['clean:reportZip', 'clean:report', 'preparePlato', 'concurrent:docs', 'compress']);
+
+  // release tasks
+  grunt.registerTask('releasePatch', ['test', 'bump-before:patch', 'contributors', 'changelog', 'bump-release:patch']);
+  grunt.registerTask('releaseMinor', ['test', 'bump-before:minor', 'contributors', 'changelog', 'bump-release:minor']);
+  grunt.registerTask('releaseMajor', ['test', 'bump-before:major', 'contributors', 'changelog', 'bump-release:major']);
+
+  // clean, test, generate docs (the CI task)
   grunt.registerTask('all', ['clean', 'test', 'docs']);

};
