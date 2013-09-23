/* jshint camelcase: false */
module.exports = function(grunt) {
  'use strict';

  // check task runtime
  require('time-grunt')(grunt);

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

    // speed up build by defining concurrent tasks
    concurrent: {
      test: ['lint', 'mochaTest', 'complexity'],
      docs: ['plato', 'yuidoc']
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
          quiet: true,
          captureFile: 'report/coverage/index.html'
        },
        src: '<%= src.test %>'
      },
      jsoncoverage: {
        options: {
          reporter: 'json-cov',
          quiet: true,
          captureFile: 'report/coverage/coverage.json'
        },
        src: '<%= src.test %>'
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

    // up version, tag & commit
    bump: {
      options: {
        files: ['package.json'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: '%VERSION%',
        tagMessage: '%VERSION%',
        push: true,
        pushTo: 'git@github.com:dalekjs/dalek.git'
      }
    },

    // generate contributors file
    contributors: {
      master: {
        path: 'CONTRIBUTORS.md',
        branch: 'master'
      }
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

  // generates a coverage badge
  grunt.registerTask('generateCoverageBadge', function () {
    var fs = require('fs');
    if (fs.existsSync(__dirname + '/node_modules/coverage-badge')) {
      if (fs.existsSync(__dirname + '/report/coverage/coverage.json')) {
        var green = [147,188,59];
        var yellow = [166,157,0];
        var red = [189,0,2];

        var getColor = function (coverage) {
          if (coverage > 90) {
            return mixColors(yellow, green, (coverage-90)/10);
          }

          if (coverage > 80) {
            return mixColors(red, yellow, (coverage-80)/10);
          }

          return createColor(red);
        };

        var mixColors = function (from, to, ratio) {
          var result = [], i;
          for (i=0; i<3; i++) {
            result[i] = Math.round(from[i] + (ratio * (to[i]-from[i])));
          }
          return createColor(result);
        };

        var createColor = function (values) {
          return 'rgba('+values[0]+','+values[1]+','+values[2]+',1)';
        };

        var Badge = require(__dirname + '/node_modules/coverage-badge/lib/Badge.js');
        var badgeFn = function(coverage) {
          coverage = Math.floor(Number(coverage));
          var badge = new Badge({
            box_color: getColor(coverage),
            box_text: coverage+'%',
            label_text: 'cov',
            height: 18,
            width: 49,
            box_width: 25,
            rounding: 0,
            padding: 0,
            label_font: '7pt DejaVu Sans',
            box_font: 'bold 7pt DejaVu Sans'
          });
          return badge.stream();
        };

        var coverage = JSON.parse(fs.readFileSync(__dirname + '/report/coverage/coverage.json')).coverage;
        var file = fs.createWriteStream(__dirname + '/report/coverage/coverage.png');
        badgeFn(coverage).pipe(file);
      }
    }
  });

  // releases a new canary build
  grunt.registerTask('release-canary', function () {
    var done = this.async();
    var pkg = grunt.config.get('pkg');
    var canaryPkg = grunt.util._.clone(pkg);

    Object.keys(canaryPkg.dependencies).forEach(function (pack) {
      if (pack.search('dalek') !== -1) {
        delete canaryPkg.dependencies[pack];
        canaryPkg.dependencies[pack + '-canary'] = 'latest';
      }
    });

    canaryPkg.name = canaryPkg.name + '-canary';
    canaryPkg.version = canaryPkg.version + '-' + grunt.template.today('yyyy-mm-dd-HH-MM-ss');

    grunt.file.write('package.json', JSON.stringify(canaryPkg, true, 2));

    // replace default includes with canary ones
    var indexContents = grunt.file.read('index.js');
    var oldContents = grunt.file.read('index.js');
    indexContents = indexContents.replace('dalek-internal-driver', 'dalek-internal-driver-canary');
    indexContents = indexContents.replace('dalek-internal-reporter', 'dalek-internal-reporter-canary');
    indexContents = indexContents.replace('dalek-internal-timer', 'dalek-internal-timer-canary');
    indexContents = indexContents.replace('dalek-internal-config', 'dalek-internal-config-canary');
    grunt.file.write('index.js', indexContents);

    var npm = require('npm');
    npm.load({}, function() {
      npm.registry.adduser(process.env.npmuser, process.env.npmpass, process.env.npmmail, function(err) {
        if (err) {
          grunt.log.error(err);
          grunt.file.write('package.json', JSON.stringify(pkg, true, 2));
          grunt.file.write('index.js', oldContents);
          done(false);
        } else {
          npm.config.set('email', process.env.npmmail, 'user');
          npm.commands.publish([], function(err) {
            grunt.file.write('package.json', JSON.stringify(pkg, true, 2));
            grunt.file.write('index.js', oldContents);
            grunt.log.ok('Published canary build to registry');
            done(!err);
          });
        }
      });
    });
  });

  // release a new version
  grunt.registerTask('release-package', function () {
    var done = this.async();
    var http = require('http');
    var pkg = grunt.config.get('pkg');
    var body = '';

    http.get('http://registry.npmjs.org/' + pkg.name, function(res) {
      res.on('data', function (data) {
        body += data;
      });

      res.on('end', function () {
        var versions = grunt.util._.pluck(JSON.parse(body).versions, 'version');
        var currVersion =  parseInt(pkg.version.replace(/\./gi, ''), 10);
        var availableVersions = versions.map(function (version) {
          return parseInt(version.replace(/\./gi, ''), 10);
        });

        if (!grunt.util._.contains(availableVersions, currVersion)) {
          var npm = require('npm');
          npm.load({}, function() {
            npm.registry.adduser(process.env.npmuser, process.env.npmpass, process.env.npmmail, function(err) {
              if (err) {
                grunt.log.error(err);
                done(false);
              } else {
                npm.config.set('email', process.env.npmmail, 'user');
                npm.commands.publish([], function(err) {
                  grunt.log.ok('Released new version: ', pkg.version);
                  done(!err);
                });
              }
            });
          });
        } else {
          done();
        }
      });
    });
  });

  // load 3rd party tasks
  require('load-grunt-tasks')(grunt);

  // define runner tasks
  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('test', ['clean:coverage', 'prepareCoverage', 'concurrent:test', 'generateCoverageBadge']);
  grunt.registerTask('docs', ['clean:reportZip', 'clean:report', 'preparePlato', 'concurrent:docs', 'compress']);
  grunt.registerTask('all', ['clean', 'test', 'docs']);

};
