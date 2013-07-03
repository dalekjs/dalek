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
var Q = require('q');

// Int. libs
var actions = require('dalek-internal-actions');
var assertions = require('dalek-internal-assertions');

var testStarted = null;
var Test;

/**
 * @module
 */

module.exports = function (opts) {
  // mixin assertions, actions & getters
  Test.prototype = _.extend(Test.prototype, actions({reporter: opts.reporter}).prototype);
  var test = new Test(opts);

  test.assert = new (assertions())({test: test});
  test.assert.done = test.done.bind(this);

  // copy assertion helper methods
  ['is'].forEach(function (method) {
    test[method] = test.assert[method].bind(test.assert);
  }.bind(this));

  // copy assertion helper methods
  ['not'].forEach(function (method) {
    test.is[method] = test.assert[method].bind(test.assert);
    test.assert.is[method] = test.assert[method].bind(test.assert);
  }.bind(this));

  test._uid = _.uniqueId('test');
  test.events = opts.events;
  test.driver = opts.driver;
  test.reporter = opts.reporter;

  // TODO: Promise driver start
  // so that we can reexecute them and clean the env between tests
  testStarted = test.driver.start(Q);
  return test;
};

/**
 * @constructor
 */

Test = function (opts) {
  this.actionPromiseQueue = [];
  this.expactation = null;
  this.runnedExpactations = 0;
  this.failedAssertions = 0;
  this.name = opts.name;
  this.uuids = {};
};

/**
 * Specify how many assertions are expected to run within a test.
 * Very useful for ensuring that all your callbacks and assertions are run.
 *
 * @param {Integer} expecatation Number of assertions that should be run
 * @return {Object} this Test object
 */

Test.prototype.expect = function (expectation) {
  this.expectation = parseInt(expectation, 10);
  return this;
};

/**
 *
 */

Test.prototype.incrementExpectations = function () {
  this.runnedExpactations++;
  return this;
};

/**
 *
 */

Test.prototype.incrementFailedAssertions = function () {
  this.failedAssertions++;
  return this;
};

/**
 *
 */

Test.prototype.checkExpectations = function () {
  return (this.runnedExpactations === this.expectation);
};

/**
 *
 */

Test.prototype.checkAssertions = function () {
  return this.failedAssertions === 0;
};

/**
 *
 */

Test.prototype.done = function () {
  var result = Q.resolve();

  // remove all previously attached event listeners to clear the message queue
  this.driver.events.removeAllListeners('driver:message');

  testStarted.fin(function () {

    // add a last deferred function on the end of the action queue,
    // to tell that this test is finished
    this.actionPromiseQueue.push(function () {
      this.deferred = Q.defer();

      if (_.isFunction(this.driver.end)) {
        this.driver.end();
      }

      this.reporter.emit('report:test:started', {name: this.name});

      this.driver.events.on('driver:message', function (data) {

        if (data && data.key === 'run.complete') {
          this.events.emit('test:' + this._uid + ':finished', 'test:finished', this);

          this.reporter.emit('report:assertion:status', {
            expected: this.expectation,
            run: this.runnedExpactations,
            status: this.checkExpectations() && this.checkAssertions()
          });


          this.reporter.emit('report:test:finished', {
            name: this.name,
            id: this._uid,
            passedAssertions: this.runnedExpactations - this.failedAssertions,
            failedAssertions: this.failedAssertions,
            runnedExpactations: this.runnedExpactations,
            status: this.checkExpectations() && this.checkAssertions(),
            nl: true
          });

          this.deferred.resolve();
        }
      }.bind(this));
      return this.deferred.promise;
    }.bind(this));

    // initialize all of the event receiver functions,
    // that later take the driver result
    this.actionPromiseQueue.forEach(function (f) {
      result = result.then(f).fail(function () {
        console.log(arguments);
      });
    }.bind(this));

    // run the driver when all actions are stored in the queue
    Q.allSettled(this.actionPromiseQueue)
      .then(this.driver.run.bind(this.driver));

  }.bind(this));

  return result;
};
