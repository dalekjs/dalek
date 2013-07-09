module.exports = function(grunt) {
  'use strict';

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
    clean: {
      coverage: ['coverage', 'report/coverage'],
      report: ['report/complexity', 'report/api', 'report/docs'],
      reportZip: ['report.zip']
    },

    // linting
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: '<%= src.lint %>'
    },

    // testing
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'coverage/blanket'
        },
        src: '<%= src.test %>'
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          quiet: true
        },
        src: '<%= src.test %>',
        dest: 'report/coverage/index.html'
      }
    },

    // code metrics
    complexity: {
      generic: {
        src: '<%= src.complexity %>',
        options: {
          cyclomatic: 10,
          halstead: 23,
          maintainability: 80
        }
      }
    },
    plato: {
      generic: {
        options : {
          jshint : grunt.file.readJSON('.jshintrc')
        },
        files: {
          'report/complexity': '<%= src.complexity %>',
        }
      }
    },

    // api docs
    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: '.',
          outdir: 'report/api'
        }
      }
    },

    // user docs
    documantix: {
      options: {
        header: 'dalekjs/dalekjs.com/master/assets/header.html',
        footer: 'dalekjs/dalekjs.com/master/assets/footer.html',
        target: 'report/docs'
      },
      src: ['index.js']
    },

    // compress artifacts
    compress: {
      main: {
        options: {
          archive: 'report.zip'
        },
        files: [
          {src: ['report/**'], dest: '/'}
        ]
      }
    }

  });

  // prepare files & folders for grunt:plato & coverage
  grunt.registerTask('preparePlato', function () {
    var fs = require('fs');

    // generate dirs for docs & reports
    ['coverage', 'report', 'report/coverage',
    'report/complexity', 'report/complexity/files',
    'report/complexity/files/index_js'].forEach(function (path) {
      if (!fs.existsSync(__dirname + '/' + path)) {
        fs.mkdirSync(__dirname + '/' + path);
      }
    });

    // store some dummy reports, so that grunt plato doesnt complain
    ['report.history.json', 'files/index_js/report.history.json'].forEach(function (file) {
      if (!fs.existsSync(__dirname + '/report/complexity/' + file)) {
        fs.writeFileSync(__dirname + '/report/complexity/' + file, '{}');
      }
    });
  });

  // prepare files & folders for coverage
  grunt.registerTask('prepareCoverage', function () {
    var fs = require('fs');

    // generate folders
    ['coverage', 'report', 'report/coverage'].forEach(function (folder) {
      if (!fs.existsSync(__dirname + '/' + folder)) {
        fs.mkdirSync(__dirname + '/' + folder);
      }
    });

    // generate code coverage helper file
    var coverageHelper = 'require("blanket")({pattern: [require("fs").realpathSync(__dirname + "/../index.js")]});';
    if (!fs.existsSync(__dirname + '/coverage/blanket.js')) {
      fs.writeFileSync(__dirname + '/coverage/blanket.js', coverageHelper);
    }
  });

  // load 3rd party tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-complexity');
  grunt.loadNpmTasks('grunt-documantix');
  grunt.loadNpmTasks('grunt-plato');

  // define runner tasks
  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('test', ['clean:coverage', 'prepareCoverage', 'lint', 'mochaTest', 'complexity']);
  grunt.registerTask('docs', ['clean:reportZip', 'clean:report', 'preparePlato', 'plato', 'documantix', 'yuidoc', 'compress']);
  grunt.registerTask('all', ['clean', 'test', 'docs']);
};
