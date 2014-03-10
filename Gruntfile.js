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
      lint: ['Gruntfile.js', 'lib/**/*.js', 'test/*.js'],
      complexity: ['lib/**/*.js'],
      test: ['test/*TEST.js'],
      src: ['lib/dalek.js']
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
          'report/complexity/files/_js',
          'report/complexity/files/_actions_js',
          'report/complexity/files/_assertions_js',
          'report/complexity/files/_reporter_js',
          'report/complexity/files/_config_js',
          'report/complexity/files/_driver_js',
          'report/complexity/files/_unit_js',
          'report/complexity/files/_suite_js',
          'report/complexity/files/_timer_js',
          'report/complexity/files/_host_js',
          'report/complexity/files/_remote_js',
          'report/complexity/files/_uuid_js',
        ],
        files: [
          'report.history.json',
          'files/_js/report.history.json',
          'files/_actions_js/report.history.json',
          'files/_assertions_js/report.history.json',
          'files/_reporter_js/report.history.json',
          'files/_config_js/report.history.json',
          'files/_driver_js/report.history.json',
          'files/_unit_js/report.history.json',
          'files/_suite_js/report.history.json',
          'files/_timer_js/report.history.json',
          'files/_host_js/report.history.json',
          'files/_remote_js/report.history.json',
          'files/_uuid_js/report.history.json',
        ]
      }
    },

    // prepare files & folders for coverage
    prepareCoverage: {
      options: {
        folders: ['coverage', 'report', 'report/coverage'],
        pattern: '[require("fs").realpathSync(__dirname + "/../lib/dalek.js"), require("fs").realpathSync(__dirname + "/../lib/dalek/")]'
      }
    },

    // add current timestamp to the html document
    includereplace: {
      dist: {
        options: {
          globals: {
            timestamp: '<%= grunt.template.today("dddd, mmmm dS, yyyy, h:MM:ss TT") %>'
          },
        },
        src: 'report/docs/*.html',
        dest: './'
      }
    },

    // user docs
    documantix: {
      options: {
        header: 'dalekjs/dalekjs.com/master/assets/header.html',
        footer: 'dalekjs/dalekjs.com/master/assets/footer.html',
        target: 'report/docs'
      },

      // actions
      actions: {
        src: ['lib/dalek/actions.js'],
        options: {
          vars: {
            title: 'DalekJS - Documentation - Actions',
            desc: 'DalekJS - Documentation - Actions',
            docs: true
          }
        }
      },

      // assertions
      assertions: {
        src: ['lib/dalek/assertions.js'],
        options: {
          vars: {
            title: 'DalekJS - Documentation - Actions',
            desc: 'DalekJS - Documentation - Actions',
            docs: true
          }
        }
      },

      // config
      config: {
        src: ['lib/dalek/config.js'],
        options: {
          vars: {
            title: 'DalekJS - Documentation - Config',
            desc: 'DalekJS - Documentation - Config',
            docs: true
          }
        }
      },

    },

    // archive docs
    archive: {
      options: {
        files: ['config.html', 'actions.html', 'assertions.html']
      }
    },

    // release canary version
    'release-canary': {
      options: {
        files: []
      }
    }

  });

  // load 3rd party tasks
  require('load-grunt-tasks')(grunt);
  grunt.loadTasks('./node_modules/dalek-build-tools/tasks');
  grunt.loadNpmTasks('grunt-documantix');

  // define runner tasks
  grunt.registerTask('lint', 'jshint');
  
  // split test & docs for speed
  grunt.registerTask('test', ['clean:coverage', 'prepareCoverage', 'concurrent:test', 'generateCoverageBadge']);
  grunt.registerTask('docs', ['clean:reportZip', 'clean:report', 'preparePlato', 'concurrent:docs', 'documantix', 'includereplace', 'compress']);
  
  // release tasks
  grunt.registerTask('releasePatch', ['test', 'bump-only:patch', 'contributors', 'changelog', 'bump-commit']);
  grunt.registerTask('releaseMinor', ['test', 'bump-only:minor', 'contributors', 'changelog', 'bump-commit']);
  grunt.registerTask('releaseMajor', ['test', 'bump-only:major', 'contributors', 'changelog', 'bump-commit']);
  
  // clean, test, generate docs (the CI task)
  grunt.registerTask('all', ['clean', 'test', 'docs']);

};
