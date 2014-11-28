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
var actions = require('./actions');
var assertions = require('./assertions');

// Default timeout for calling done
var DONE_TIMEOUT = 10000;

/**
 * Prepares the test instance values
 *
 * @param {object} opts Options like the tests name, etc.
 * @constructor
 */

var Unit = function (opts) {
  // prepare meta queue data
  this.actionPromiseQueue = [];

  // prepare assertion data
  this.expectation = null;
  this.runnedExpactations = 0;
  this.failedAssertions = 0;

  // prepare test specific data
  this.name = opts.name;
  this.lastChain = [];
  this.uuids = {};
  this.contextVars = {};

  if (this.name) {
    this.timeoutForDone = setTimeout(function () {
      this.done();
      this.reporter.emit('warning', 'done() not called before timeout!');
    }.bind(this), DONE_TIMEOUT);
  }
};

/**
 * Generates an test instance
 *
 * @module DalekJS
 * @class Unit
 * @namespace Dalek
 * @part test
 * @api
 */

Unit.prototype = {

  /**
   * Specify how many assertions are expected to run within a test.
   * Very useful for ensuring that all your callbacks and assertions are run.
   *
   * @method expect
   * @param {Integer} expecatation Number of assertions that should be run
   * @chainable
   */

  expect: function (expectation) {
    this.expectation = parseInt(expectation, 10);
    return this;
  },

  /**
   * Global data store (works between the node & browser envs)
   *
   * @method data
   * @param {string|number} key Key to store or fetch data
   * @param {mixed} value *optional* Data that should be stored
   * @return {mixed} Data that has been stored
   * @chainable
   */

  data: function (key, value) {
    if (value) {
      this.contextVars[key] = value;
      return this;
    }

    return this.contextVars[key];
  },

  /**
   * Increment the number of executed assertions
   *
   * @method incrementExpectations
   * @chainable
   */

  incrementExpectations: function () {
    this.runnedExpactations++;
    return this;
  },

  /**
   * Increment the number of failed assertions
   *
   * @method incrementFailedAssertions
   * @chainable
   */

  incrementFailedAssertions: function () {
    this.failedAssertions++;
    return this;
  },

  /**
   * Checks if the runned tests fullfill the set expectations
   * or if no expectations were raised
   *
   * @method checkExpectations
   * @return {bool} checkedExpectations Expectations match
   */

  checkExpectations: function () {
    return (this.expectation === null || !this.expectation || (this.runnedExpactations === this.expectation));
  },

  /**
   * Checks if all runned assertions passed
   *
   * @method checkAssertions
   * @return {bool} assertionFailed Any expectation failed
   */

  checkAssertions: function () {
    return this.failedAssertions === 0;
  },

  /**
   * Sets up all the bindings needed for a test to run
   *
   * @method done
   * @return {object} result A promise
   * @private
   */

  done: function () {
    var result = Q.resolve();
    // clear the done error timeout
    clearTimeout(this.timeoutForDone);
    // remove all previously attached event listeners to clear the message queue
    this.driver.events.removeAllListeners('driver:message');
    // resolve the deferred when the test is finished
    Unit.testStarted.fin(this._testFinished.bind(this, result));
    return result;
  },

  /**
   * Allow to use custom functions in order to embrace code reuse across
   * multiple files (for example for use in Page Objects).
   *
   * @method andThen
   * @param {function} a function, where 'this' references the test
   * @chainable
   */
  andThen: function(func) {
    return func.call(this);
  },

  /**
   * Adds a node style function (with node err callback) style to the test.
   *
   * @method node
   * @param {function} a node function that is executed in the context of the test.
   * @chainable
   */
  node: function(nodeFunction) {
    var deferred = Q.defer(),
      that = this;
    nodeFunction.call(this, function(err) {
      if (typeof err !== 'undefined') {
        that.reporter.emit('error', err);
        that.incrementFailedAssertions();
        deferred.reject();
      } else {
        deferred.resolve();
      }
    });
    this.promise(deferred);
    return this;
  },

  /**
   * Adds a promise to the chain of tests.
   *
   * @method promise
   * @param {promise} a q promise
   * @chainable
   */
  promise: function(deferred) {
    this.actionPromiseQueue.push(deferred);
    return this;
  },

  /**
   * Emits the test finished events & resolves all promises
   * when its done
   *
   * @method _testFinished
   * @param {object} result Promised result var
   * @return {object} result Promised result var
   * @private
   */

  _testFinished: function (result) {
    // add a last deferred function on the end of the action queue,
    // to tell that this test is finished
    this.actionPromiseQueue.push(this._testFin.bind(this));

    // initialize all of the event receiver functions,
    // that later take the driver result
    this.actionPromiseQueue.forEach(function (f) {
      result = result.then(f).fail(function () {
        console.error(arguments);
        process.exit(0);
      });
    }.bind(this));

    // run the driver when all actions are stored in the queue
    Q.allSettled(this.actionPromiseQueue)
      .then(this.driver.run.bind(this.driver));

    return result;
  },

  /**
   * Emits the test started event
   *
   * @method _reportTestStarted
   * @param {string} name Name of the test
   * @chainable
   * @private
   */

  _reportTestStarted: function (name) {
    this.reporter.emit('report:test:started', {name: name});
    return this;
  },

  /**
   * Checks if the test run is complete & emits/resolves
   * all the needed events/promises when the run is complete
   *
   * @method _onDriverMessage
   * @param {object} data Data that is returned by the driver:message event
   * @chainable
   * @private
   */

  _onDriverMessage: function (data) {
    // check if the test run is complete
    if (data && data.key === 'run.complete') {
      // emit the test finish events & resolve the deferred
      this._emitConcreteTestFinished();
      this._emitAssertionStatus();
      this._emitTestFinished();
      this.deferred.resolve();
    }

    return this;
  },

  /**
   * Emits an event, that the current test run has been finished
   *
   * @method _emitConcreteTestFinished
   * @chainable
   * @private
   */

  _emitConcreteTestFinished: function () {
    this.events.emit('test:' + this._uid + ':finished', 'test:finished', this);
    return this;
  },

  /**
   * Emits an event that describes the current state of all assertions
   *
   * @method _emitAssertionStatus
   * @chainable
   * @private
   */

  _emitAssertionStatus: function () {
    this.reporter.emit('report:assertion:status', {
      expected: (this.expectation ? this.expectation : this.runnedExpactations),
      run: this.runnedExpactations,
      status: this._testStatus()
    });
    return this;
  },

  /**
   * Get the overall test status (assertions & expectation)
   *
   * @method _testStatus
   * @return {bool} status The test status
   * @chainable
   * @private
   */

  _testStatus: function () {
    return this.checkExpectations() && this.checkAssertions();
  },

  /**
   * Emits an event that describes the current state of all assertions.
   * The event should be fired when a test is finished
   *
   * @method _emitTestFinished
   * @chainable
   * @private
   */

  _emitTestFinished: function () {
    this.reporter.emit('report:test:finished', {
      name: this.name,
      id: this._uid,
      passedAssertions: this.runnedExpactations - this.failedAssertions,
      failedAssertions: this.failedAssertions,
      runnedExpactations: this.runnedExpactations,
      status: this._testStatus(),
      nl: true
    });

    return this;
  },

  /**
   * Kicks off the test & binds all promises/events
   *
   * @method _testFin
   * @return {object} promise A promise
   * @private
   */

  _testFin: function () {
    this.deferred = Q.defer();

    if (_.isFunction(this.driver.end)) {
      this.driver.end();
    }

    // emit report startet event
    this._reportTestStarted(this.name);

    // listen to all the messages from the driver
    this.driver.events.on('driver:message', this._onDriverMessage.bind(this));
    return this.deferred.promise;
  },

  /**
   * Copies assertion methods
   *
   * @method _inheritAssertions
   * @param {Test} test Instacne of test
   * @chainable
   * @private
   */

  _inheritAssertions: function (test) {
    ['is'].forEach(function (method) {
      test[method] = test.assert[method].bind(test.assert);
    });
    return test;
  },

  /**
   * Copies assertion helper methods
   *
   * @method _inheritAssertions
   * @param {Test} test Instacne of test
   * @chainable
   * @private
   */

  _inheritAssertionHelpers: function (test) {
    ['not', 'between', 'gt', 'gte', 'lt', 'lte', 'equalsCaseInsensitive'].forEach(function (method) {
      test.is[method] = test.assert[method].bind(test.assert);
      test.assert.is[method] = test.assert[method].bind(test.assert);
    });
    ['contain', 'match'].forEach(function (method) {
      test.to = test.to || {};
      test.assert.to = test.assert.to || {};

      test.to[method] = test.assert[method].bind(test.assert);
      test.assert.to[method] = test.assert[method].bind(test.assert);
    });
    ['notContain'].forEach(function (method) {
      var apiName = method.substr(3, 1).toLowerCase() + method.substr(4);
      test.to.not = test.to.not || {};
      test.assert.to.not = test.assert.to.not || {};

      test.to.not[apiName] = test.assert[method].bind(test.assert);
      test.assert.to.not[apiName] = test.assert[method].bind(test.assert);
    });
    return test;
  },

  /**
   * Set up the instance
   *
   * @method _inheritAssertions
   * @param {Test} test Instacne of test
   * @param {object} opts Options
   * @chainable
   * @private
   */

  _initialize: function (test, opts) {
    test._uid = _.uniqueId('test');
    test.events = opts.events;
    test.driver = opts.driver;
    test.reporter = opts.reporter;
    return test;
  }

};

/**
 * Alias for 'andThen'; use if it is the first function called in the test case.
 *
 * @method start
 * @chainable
 */
Unit.prototype.start = Unit.prototype.andThen;

// export a function that generates a new test instance
module.exports = function (opts) {
  // mixin assertions, actions & getters
  Unit.prototype = _.extend(Unit.prototype, actions({reporter: opts.reporter}).prototype);
  var unit = new Unit(opts);
  unit.assert = new (assertions())({test: unit});
  unit.assert.done = unit.done.bind(this);
  unit.assert.query = unit.query.bind(unit.assert);
  unit.assert.$ = unit.query.bind(unit.assert);
  unit.end = unit.assert.end.bind(unit.assert);

  // copy log methods
  unit.log = {};
  unit.log.dom = unit.logger.dom.bind(unit);
  unit.log.message = unit.logger.message.bind(unit);

  // copy assertions methods
  unit = unit._inheritAssertions(unit);

  // copy assertion helper methods
  unit = unit._inheritAssertionHelpers(unit);

  // initialize the instance
  unit = unit._initialize(unit, opts);

  // TODO: Promise driver start
  // so that we can reexecute them and clean the env between tests
  Unit.testStarted = unit.driver.start(Q);
  return unit;
};
