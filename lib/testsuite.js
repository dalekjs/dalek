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
module.exports = function (opts) {
  return new Testsuite(opts);
};

/**
 * @constructor
 */

Testsuite = function (opts) {
  this.emitter = new EventEmitter2();

  this.driverEmitter = opts.driverEmitter;
  this.reporterEmitter = opts.reporterEmitter;
  this.driver = opts.driver;
  this.name = opts.file;

  this.suite = require(process.cwd() + '/' + opts.file.replace('.js', ''));
  this.suite._uid = _.uniqueId('Suite');
};

Testsuite.prototype.testFinished = function (event) {

};

/**
 * Runs any tests from this testsuite in sequence
 */

Testsuite.prototype.run = function (callback) {
  var tests = [];
  if (this.suite.name && _.isString(this.suite.name)) {
    this.name = this.suite.name;
  }

  if (this.suite.options && _.isObject(this.suite.options)) {
    this.options = this.suite.options;
  }

  delete this.suite.name;
  delete this.suite.options;

  tests = Object.keys(this.suite);
  this.numberOfTests = tests.length;
  this.testsToBeExecuted = this.numberOfTests;

  // start the first test
  var testName = tests.shift();
  var testinst = test({events: this.emitter, driver: this.driver, reporter: this.reporterEmitter, name: testName});
  this.suite[testName](testinst);

  // listen to the test:finished event & then start the next test
  // if there are no tests in this suite left,
  // run the async callback & mark this suite as finished
  this.emitter.onAny(function (event) {
    console.log(arguments);
    if (event === 'test:finished') {
      this.testsToBeExecuted--;
      if ((this.testsToBeExecuted-1) > 0) {
        var name = tests.shift();
        var inst = test({name: name, events: this.emitter, driver: this.driver, reporter: this.reporterEmitter});
        this.suite[name](inst);
      } else {
        callback();
      }

    }
  }.bind(this, callback));
};
