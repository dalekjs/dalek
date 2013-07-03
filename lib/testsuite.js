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

// Ext. libs
var _ = require('lodash');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

// Int. libs
var test = require('./test');

/**
 * @module
 */

var Testsuite;

/**
 * @constructor
 * @param {object} options
 */

Testsuite = function (options) {
  this.emitter = new EventEmitter2();
  this.initialize(options);
  this.suite = this.loadTestsuite(options.file);
};

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

Testsuite.prototype.initialize = function (options) {
  this.driverEmitter = options.driverEmitter;
  this.reporterEmitter = options.reporterEmitter;
  this.driver = options.driver;
  this.name = options.file;
  return this;
};

/**
 * Loads the testsuite that should be executed
 *
 * @method loadTestsuite
 * @param {string} testfile
 * @return {object} testsuite
 */

Testsuite.prototype.loadTestsuite = function (testfile) {
  var suite;
  suite = require(process.cwd() + '/' + testfile.replace('.js', ''));
  suite._uid = _.uniqueId('Suite');
  return suite;
};

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

Testsuite.prototype.testFinished = function (callback, tests, test, event) {
  if (event === 'test:finished') {
    this.testsToBeExecuted--;
    if ((this.testsToBeExecuted-1) > 0) {
      var name = this.getNextTest(tests);
      this.suite[name](test({name: name, events: this.emitter, driver: this.driver, reporter: this.reporterEmitter}));
    } else {
      callback();
    }
  }

  return this;
};

/**
 * Returns the name of the testsuite
 * If the suite has no name, it will return the testsuites filename
 *
 * @method getName
 * @return {string} name
 */

Testsuite.prototype.getName = function () {
  if (this.suite.name && _.isString(this.suite.name)) {
    var name = this.suite.name;
    delete this.suite.name;
    return name;
  }

  return this.name;
};

/**
 * Returns the options of the testsuite
 * If the suite has no options, it will return `null`
 *
 * @method getOptions
 * @return {object|null} options
 */

Testsuite.prototype.getOptions = function () {
  if (this.suite.options && _.isObject(this.suite.options)) {
    var options = this.suite.options;
    delete this.suite.options;
    return options;
  }

  return null;
};

/**
 * Returns all names (aka. object keys) the tests that should be executed
 *
 * @method getTests
 * @return {array} test
 */

Testsuite.prototype.getTests = function () {
  return Object.keys(this.suite);
};

/**
 * Returns the number of tests to be executed
 *
 * @method getNumberOfTests
 * @param {array} tests
 * @return {integer} numberOfTests
 */

Testsuite.prototype.getNumberOfTests = function (tests) {
  return tests.length;
};

/**
 * Returns the next test, that should be executed
 *
 * @method getNextTest
 * @return {string} testName
 */

Testsuite.prototype.getNextTest = function (tests) {
  return tests.shift();
}

/**
 * Runs any tests from this testsuite in sequence
 *
 * @method run
 * @param {function} callback
 * @chainable
 */

Testsuite.prototype.run = function (callback) {
  var tests = [];

  // extract suite name
  this.name = this.getName();
  // extract suite options
  this.options = this.getOptions();

  // extract tests
  tests = this.getTests();
  this.testsToBeExecuted = this.numberOfTests = this.getNumberOfTests(tests);

  // grab the first test in the queue
  var testName = this.getNextTest(tests);
  // generate an instance of the first test & start it
  this.suite[testName](test({events: this.emitter, driver: this.driver, reporter: this.reporterEmitter, name: testName}));

  // listen to the test:finished event & then start the next test
  // if there are no tests in this suite left,
  // run the async callback & mark this suite as finished
  this.emitter.onAny(this.testFinished.bind(this, callback, tests, test));
  return this;
};

// export the instance
module.exports = function (opts) {
  return new Testsuite(opts);
};
