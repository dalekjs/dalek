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

var Q = require('q');
var _ = require('lodash');

/**
 * @module
 */

module.exports = function () {
    return Assertions;
};

/**
 * @constructor
 */

function Assertions (opts) {
  this.test = opts.test;
  this.chaining = false;
};

Assertions.prototype.chain = function () {
  this.chaining = true;
  return this;
};

Assertions.prototype.end = function () {
  this.chaining = false;
  return this.test;
};

/**
 *  Tests if value is a true value
 */

Assertions.prototype.ok = function (value, message) {};

/**
 * Tests shallow, coercive equality with the equal comparison operator ( == ).
 */

Assertions.prototype.equals = function (actual, expected, message) {};

/**
 * Asserts that an value is within a min/max range.
 */

Assertions.prototype.between = function (actual, expectedMin, expectedMax, message) {};

/**
 * Tests shallow, coercive non-equality with the not equal comparison operator ( != )
 */

Assertions.prototype.notEquals = function (actual, expected, message) {};

/**
 * Asserts that a code evaluation in remote DOM strictly resolves to a boolean true.
 */

Assertions.prototype.evalOk = function (fn, message) {};

/**
 * Asserts that the result of a code evaluation in remote DOM strictly equals to the expected value.
 */

Assertions.prototype.evalEquals = function (fn, expected, message) {};

/**
 * Asserts that a given ressource does exist in the environment.
 */

Assertions.prototype.resourceExists = function (url, message) {
  var hash = _.uniqueId('resourceExists');
  var cb = this._generateCallbackAssertion('resourceExists', 'resourceExists', this._testTruthy, hash, {url: url, message: message}).bind(this.test);
  this._addToActionQueue([url, hash], 'resourceExists', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that a given element appears n times on the page.
 */

Assertions.prototype.numberOfElements = function (selector, expected, message) {
  var hash = _.uniqueId('numberOfElements');
  var cb = this._generateCallbackAssertion('numberOfElements', 'numberOfElements', this._testShallowEquals, hash, {expected: expected, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'getNumberOfElements', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that a given form field has the provided value.
 */

Assertions.prototype.val = function (selector, expected, message) {
  var hash = _.uniqueId('val');
  var cb = this._generateCallbackAssertion('val', 'val', this._testShallowEquals, hash, {expected: expected, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'getValue', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that current HTTP status code is the same as the one passed as argument.
 * TODO: Needs some work
 */

Assertions.prototype.httpStatus = function (status, message) {
  var hash = _.uniqueId('httpStatus');
  var cb = this._generateCallbackAssertion('httpStatus', 'httpStatus', this._testShallowEquals, hash, {expected: status, message: message}).bind(this.test);
  this._addToActionQueue([status, hash], 'httpStatus', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that an element matching the provided selector expression exists in remote DOM environment.
 */

Assertions.prototype.exists = function (selector, message) {
  var hash = _.uniqueId('exists');
  var cb = this._generateCallbackAssertion('exists', 'exists', this._testTruthy, hash, {selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, hash], 'exists', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that an element matching the provided selector expression doesn't exists within the remote DOM environment.
 */

Assertions.prototype.doesntExist = function (selector, message) {
  var hash = _.uniqueId('exists');
  var cb = this._generateCallbackAssertion('exists', '!exists', this._testFalsy, hash, {selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, hash], 'exists', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that the element matching the provided selector expression is not visible.
 */

Assertions.prototype.notVisible = function (selector, message) {
  var hash = _.uniqueId('visible');
  var cb = this._generateCallbackAssertion('visible', '!visible', this._testFalsy, hash, {selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, hash], 'visible', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that the element matching the provided selector expression is visible.
 */

Assertions.prototype.visible = function (selector, message) {
  var hash = _.uniqueId('visible');
  var cb = this._generateCallbackAssertion('visible', 'visible', this._testTruthy, hash, {selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, hash], 'visible', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that given text does not exist in the provided selector.
 */

Assertions.prototype.doesntHaveText = function (selector, expected, message) {
  var hash = _.uniqueId('text');
  var cb = this._generateCallbackAssertion('text', '!text', this._testShallowUnequals, hash, {selector: selector, expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'text', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that given text does exist in the provided selector.
 */

Assertions.prototype.text = function (selector, expected, message) {
  var hash = _.uniqueId('text');
  var cb = this._generateCallbackAssertion('text', 'text', this._testShallowEquals, hash, {selector: selector, expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'text', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that given text does exist in the provided selector.
 *
 * @param {String} expected
 * @param {String} message
 * @return {Object}
 */

Assertions.prototype.title = function (expected, message) {
  var hash = _.uniqueId('title');
  var cb = this._generateCallbackAssertion('title', 'title', this._testShallowEquals, hash, {expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([expected, hash], 'title', cb);
  return this.chaining ? this : this.test;
};

/**
 *
 */

Assertions.prototype.url = function (expected, message) {
  var hash = _.uniqueId('url');
  var cb = this._generateCallbackAssertion('url', 'url', this._testShallowEquals, hash, {expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([expected, hash], 'url', cb);
  return this.chaining ? this : this.test;
};

/**
 *
 */

Assertions.prototype.attr = function (selector, attribute, expected, message) {
  var hash = _.uniqueId('attribute');
  var cb = this._generateCallbackAssertion('attribute', 'attribute', this._testShallowEquals, hash, {expected: expected, message: message, selector: selector, attribute: attribute}).bind(this.test);
  this._addToActionQueue([selector, attribute, expected, hash], 'attribute', cb);
  return this.chaining ? this : this.test;
};

// HELPER METHODS
// --------------

/**
 *
 */

Assertions.prototype._generateCallbackAssertion = function (key, type, test, hash, opts) {
  var cb = function (data) {
    if (data && data.key === key && data.hash === hash) {
      var testResult = test(data.value, opts.expected);

      this.reporter.emit('report:assertion', {
        success: testResult,
        expected: opts.expected,
        value: data.value,
        message: opts.message,
        type: type
      });

      this.incrementExpectations();
      if (!testResult) this.incrementFailedAssertions();
    }
  };
  return cb;
};

/**
 *
 */

Assertions.prototype._addToActionQueue = function (opts, driverMethod, cb) {
  this.test.actionPromiseQueue.push(function () {
    var deferredAction = Q.defer();
    this.test.driver[driverMethod].apply(this.test.driver, opts);
    deferredAction.resolve();
    this.test.driver.events.on('driver:message', cb);
    return deferredAction.promise;
  }.bind(this));
  return this;
};

/**
 *
 */

Assertions.prototype._testShallowEquals = function (a, b) {
  return (a == b);
};

/**
 *
 */

Assertions.prototype._testShallowUnequals = function (a, b) {
  return (a != b);
};

/**
 *
 */

Assertions.prototype._testTruthy = function (a) {
  return a === 'true' || a === true;
};

/**
 *
 */

Assertions.prototype._testFalsy = function (a) {
  return a === 'false' || a === false;
};
