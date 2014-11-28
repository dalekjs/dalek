/*!
 *
 * Copyright (c) 2013 Sebastian Golasch
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

'use strict';

// ext. libs
var _ = require('lodash');
var fs = require('fs');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

// int. libs
var unit = require('./unit');

/**
 * @constructor
 * @param {object} options
 */

var Suite = function (options) {
  this.emitter = new EventEmitter2();
  this.emitter.setMaxListeners(Infinity);
  this.initialize(options);
  this.suite = this.loadTestsuite(options.file);
};

/**
 * Suite (Testsuite)
 *
 * @module DalekJS
 * @class Suite
 * @namespace Dalek
 * @part Testsuite
 * @api
 */

Suite.prototype = {

  /**
   * Assigns the initial options
   * driverEmitter -> the drivers event dispatcher
   * reporterEmitter -> the reporters event dispatcher
   * driver -> the driver instance (e.g. native webdriver, selenium, etc.)
   * name -> the suites filename (default suite name)
   *
   * @method initialize
   * @param {object} options
   * @chainable
   */

  initialize: function (options) {
    this.driverEmitter = options.driverEmitter;
    this.reporterEmitter = options.reporterEmitter;
    this.driver = options.driver;
    this.name = options.file;
    this.numberOfSuites = options.numberOfSuites;
    this.error = null;
    return this;
  },

  /**
   * Loads the testsuite that should be executed
   *
   * @method loadTestsuite
   * @param {string} testfile
   * @return {object} testsuite
   */

  loadTestsuite: function (testfile) {
    var suite = {};

    // if the tests were passed in *as* a list of tests, just use them
    if (testfile && typeof testfile === 'object') {
      var allAreTestFunctions = true;
      for (var testname in testfile) {
        if (typeof testfile[testname] !== 'function') { allAreTestFunctions = false; }
      }
      if (allAreTestFunctions) {
        return testfile;
      }
    }

    // catch any errors, like falsy requires & stuff
    try {

      if (fs.existsSync(process.cwd() + '/' + testfile)) {
        suite = require(process.cwd() + '/' + testfile.replace('.js', ''));
      } else {
        this.error = 'Suite "' + testfile + '" does not exist. Skipping!';
        return suite;
      }
    } catch (e) {
      this.error = '\n' + e.name + ': ' + e.message + '\nFailure loading suite "' + testfile + '". Skipping!' + e;
      return suite;
    }

    suite._uid = _.uniqueId('Suite');
    return suite;
  },

  /**
   * Checks if all tests from the testsuite are executed.
   * Runs the next test if not.
   * Triggers `asyncs` callback if the suite is finished.
   * Decrements the `testsToBeExecuted` counter
   *
   * @method testFinished
   * @param {function} callback
   * @param {array} tests
   * @param {object} test
   * @param {string} event
   * @chainable
   */

  testFinished: function (callback, tests) {
    var complete = function() {
      // check if there are still tests that should be executed in this suite,
      // if so, run them
      if (this.decrementTestsToBeExecuted() > 1) {
        this.executeNextTest(tests);
        return this;
      }

      // run a function after the testsuite, if given
      if (this.options.teardown) {
        this.options.teardown();
      }

      // emit the suite finished event
      this.reporterEmitter.emit('report:testsuite:finished', this.name);

      // move on to the next suite
      callback();
      return this;
    }.bind(this);

    // run a function after the test, if given

    if (typeof this.options.afterEach === 'function') {
      // If there is an argument, assume async.
      if (this.options.afterEach.length === 1) {
        this.options.afterEach(function() {
          return complete();
        }.bind(this));
      } else {
        // no argument, assume sync.
        this.options.afterEach();
        return complete();
      }
    } else {
        return complete();
    }

  },

  /**
   * Decrements number of tests that should be executed in this suite
   *
   * @method decrementTestsToBeExecuted
   * @return {integer} numberOfTestsToBeExecuted
   */

  decrementTestsToBeExecuted: function () {
    return (this.testsToBeExecuted--) -1;
  },

  /**
   * Returns the name of the testsuite
   * If the suite has no name, it will return the testsuites filename
   *
   * @method getName
   * @return {string} name
   */

  getName: function () {
    if (this.suite.name && _.isString(this.suite.name)) {
      var name = this.suite.name;
      delete this.suite.name;
      return name;
    }

    return this.name;
  },

  /**
   * Returns the options of the testsuite
   * If the suite has no options, it will return an empty object
   *
   * @method getOptions
   * @return {object} options Suite options
   */

  getOptions: function () {
    if (this.suite.options && _.isObject(this.suite.options)) {
      var options = this.suite.options;
      delete this.suite.options;
      return options;
    }

    return {};
  },

  /**
   * Returns all names (aka. object keys) the tests that should be executed
   *
   * @method getTests
   * @return {array} test
   */

  getTests: function () {
    return Object.keys(this.suite);
  },

  /**
   * Returns the number of tests to be executed
   *
   * @method getNumberOfTests
   * @param {array} tests
   * @return {integer} numberOfTests
   */

  getNumberOfTests: function (tests) {
    return tests.length;
  },

  /**
   * Returns the next test, that should be executed
   *
   * @method getNextTest
   * @return {string} testName
   */

  getNextTest: function (tests) {
    return tests.shift();
  },

  /**
   * Executes the next test in the sequence
   *
   * @method executeNextTest
   * @param {array} tests
   * @return {mixed} testValue
   */

  executeNextTest: function (tests, callback) {
    var cb = callback || function() {};
    // grab the next test in the queue
    var testName = this.getNextTest(tests);
    // get the next test function
    var testFunction = this.getTest(testName);
    // generate an instance of the test
    var test = this.getTestInstance(testName);
    // run a setup function before the test, if given
    if (typeof this.options.beforeEach !== 'function') {
      cb(null, null);
      testFunction.apply(test,[test]);
      return this;
    }
    if (this.options.beforeEach.length === 1) {
      // if function takes an argument, assume async
      this.options.beforeEach(function() {
        // start it
        testFunction.apply(test,[test]);
        cb(null, null);
      });
    } else {
      // otherwise, assume sync
      this.options.beforeEach();
      testFunction.apply(test,[test]);
      cb(null, null);
    }
    return this;
  },

  /**
   * Generates a new test instance
   *
   * @method getTestInstance
   * @param {string} name
   * @return {Dalek.Test} test
   */

  getTestInstance: function (name) {
    return unit({events: this.emitter, driver: this.driver, reporter: this.reporterEmitter, name: name});
  },

  /**
   * Returns a test function by its name
   *
   * @method getTest
   * @param {string} name
   * @return {function} test
   */

  getTest: function (name) {
    return this.suite[name] && _.isFunction(this.suite[name]) ? this.suite[name] : this.testDoesNotExist;
  },

  /**
   * Will be executed if a test is started, that does not exist
   *
   * @method testDoesNotExist
   * @param {object} options
   */

  testDoesNotExist: function (options) {
    if (options.name) {
      this.reporterEmitter.emit('warning', 'Test "' + options.name + '" does not exist! Skipping.');
    }
    return this;
  },

  /**
   * Runs any tests from this testsuite in sequence
   *
   * @method run
   * @param {function} callback
   * @chainable
   */

  run: function (callback) {
    var tests = [];

    // check if the suite is
    if (this.error) {
      this.reporterEmitter.emit('report:testsuite:started', null);
      // emit a warning notice
      this.reporterEmitter.emit('warning', this.error);
      // emit the suite finished event
      this.reporterEmitter.emit('report:testsuite:finished', null);
      // move on to the next suite
      callback();
    }

    // extract suite name
    this.name = this.getName();
    // extract suite options
    this.options = this.getOptions();

    // extract tests
    tests = this.getTests();
    this.testsToBeExecuted = this.numberOfTests = this.getNumberOfTests(tests);

    // run a function before the testsuite has been launched, if given
    if (this.options.setup) {
      this.options.setup();
    }

    // kickstart the test execution
    this.executeNextTest(tests, function() {
      // emit the suite started event
      this.reporterEmitter.emit('report:testsuite:started', this.name);
      // listen to the test:finished event & then start the next test
      // if there are no tests in this suite left,
      // run the async callback & mark this suite as finished
      this.emitter.onAny(this.testFinished.bind(this, callback, tests));
    }.bind(this));

    return this;
  }
};

// export the testuite instance
module.exports = Suite;
