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
 */

'use strict';

var Q = require('q');
var _ = require('lodash');

/**
 * @module
 */

var reporter = null;

module.exports = function (opts) {
  reporter = opts.reporter;
  return Actions;
};

/**
 * @constructor
 */

function Actions (opts) {
  this.uuids = {};
};

Actions.prototype.uuids = {};

Actions.prototype.$ = function (selector) {
  return this;
};

/**
 * Triggers a mouse event on the first element found matching the provided selector.
 * Supported events are mouseup, mousedown, click, mousemove, mouseover and mouseout.
 * TODO: IMPLEMENT
 *
 * @param {string} type
 * @param {string} selector
 * @return {Actions}
 */

Actions.prototype.mouseEvent = function (type, selector) {
  var hash = _.uniqueId('mouseEvent');
  var cb = this._generateCallbackAssertion('mouseEvent', 'mouseEvent', type, selector, hash);
  this._addToActionQueue([type, selector, hash], 'mouseEvent', cb);
  return this;
};

/**
 * Sets HTTP_AUTH_USER and HTTP_AUTH_PW values for HTTP based authentication systems.
 * TODO: IMPLEMENT
 *
 * @param {string} username
 * @param {string} password
 * @return {Actions}
 */

Actions.prototype.setHttpAuth = function (username, password) {
  var hash = _.uniqueId('setHttpAuth');
  var cb = this._generateCallbackAssertion('setHttpAuth', 'setHttpAuth', username, password, hash);
  this._addToActionQueue([username, password, hash], 'setHttpAuth', cb);
  return this;
};

/**
 * Switches to an iFrame context
 *
 * @method toIFrame
 * @param {number} index
 * @return {Actions}
 */

Actions.prototype.toIframe = function (index) {
  var hash = _.uniqueId('toIframe');
  var cb = this._generateCallbackAssertion('toIframe', 'toIframe', index, hash);
  this._addToActionQueue([index, hash], 'toIframe', cb);
  return this;
};

Actions.prototype.end = function () {
  var hash = _.uniqueId('endIFrameContext');
  var cb = this._generateCallbackAssertion('endIFrameContext', 'endIFrameContext', hash);
  this._addToActionQueue([hash], 'endIFrameContext', cb);
  return this;
};

/**
 * Waits until a function returns true to process any next step.
 *
 * You can also set a callback on timeout using the onTimeout argument, and set the timeout using the timeout one, in milliseconds. The default timeout is set to 5000ms.
 * TODO: IMPLEMENT
 *
 * @param {function} fn
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitFor = function (fn, timeout) {
  var hash = _.uniqueId('waitFor');
  var cb = this._generateCallbackAssertion('waitFor', 'waitFor', fn, timeout, hash);
  this._addToActionQueue([fn, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitFor', cb);
  return this;
};

/**
 * Wait until a resource that matches the given testFx is loaded to process a next step.
 * TODO: IMPLEMENT
 *
 * @param {string} ressource
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitForResource = function (ressource, timeout) {
  var hash = _.uniqueId('waitForResource');
  var cb = this._generateCallbackAssertion('waitForResource', 'waitForResource', ressource, timeout, hash);
  this._addToActionQueue([ressource, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForResource', cb);
  return this;
};

/**
 * Waits until the passed text is present in the page contents before processing the immediate next step.
 * TODO: IMPLEMENT
 *
 * @param {string} text
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitForText = function (text, timeout) {
  var hash = _.uniqueId('waitForText');
  var cb = this._generateCallbackAssertion('waitUntilVisible', 'waitUntilVisible', text, timeout, hash);
  this._addToActionQueue([text, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForText', cb);
  return this;
};

/**
 * Waits until an element matching the provided selector expression is visible in the remote DOM to process a next step.
 * TODO: IMPLEMENT
 *
 * @param {string} selector
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitUntilVisible = function (selector, timeout) {
  var hash = _.uniqueId('waitUntilVisible');
  var cb = this._generateCallbackAssertion('waitUntilVisible', 'waitUntilVisible', selector, timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitUntilVisible', cb);
  return this;
};

/**
 * Waits until an element matching the provided selector expression is no longer visible in remote DOM to process a next step.
 * TODO: IMPLEMENT
 *
 * @param {string} selector
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitWhileVisible = function (selector, timeout) {
  var hash = _.uniqueId('waitWhileVisible');
  var cb = this._generateCallbackAssertion('waitWhileVisible', 'waitWhileVisible', selector, timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitWhileVisible', cb);
  return this;
};

/**
 * Captures the current browser contents
 * TODO:
 * IMPLEMENT CONFIG BASED GENERAL PATH
 * IMPLEMENT: :browser, :env, :viewport related dynamically replacements for filename
 * IMPLEMENT: configurable area (px based) to screenshot
 * IMPLEMENT; configurable area (selector based) to screenshot
 *
 * @param {string} pathname
 * @return {Actions}
 */

Actions.prototype.screenshot = function (pathname) {
  var hash = _.uniqueId('screenshot');
  var cb = this._generateCallbackAssertion('screenshot', 'screenshot', pathname, hash);
  this._addToActionQueue(['', pathname, hash], 'screenshot', cb);
  return this;
};

/**
 * Pause steps suite execution for a given amount of time, and optionally execute a step on done.
 *
 * @param {number} timeout in milliseconds
 * @return {Actions}
 */

Actions.prototype.wait = function (timeout) {
  var hash = _.uniqueId('wait');
  var cb = this._generateCallbackAssertion('wait', 'wait', timeout, hash);
  this._addToActionQueue([(timeout ? parseInt(timeout, 10) : 5000), hash], 'wait', cb);
  return this;
};

/**
 * Reloads current page location.
 *
 * @return {Actions}
 */

Actions.prototype.reload = function () {
  var hash = _.uniqueId('reload');
  var cb = this._generateCallbackAssertion('reload', 'reload', '', hash);
  this._addToActionQueue([hash], 'reload', cb);
  return this;
};

/**
 * Moves a step forward in browser's history.
 *
 * @return {Actions}
 */

Actions.prototype.forward = function () {
  var hash = _.uniqueId('forward');
  var cb = this._generateCallbackAssertion('forward', 'forward', '', hash);
  this._addToActionQueue([hash], 'forward', cb);
  return this;
};

/**
 * Moves back a step in browser's history.
 *
 * @return {Actions}
 */

Actions.prototype.back = function () {
  var hash = _.uniqueId('back');
  var cb = this._generateCallbackAssertion('back', 'back', '', hash);
  this._addToActionQueue([hash], 'back', cb);
  return this;
};

/**
 * Performs a click on the element matching the provided selector expression.
 *
 * @param {string} selector
 * @return {Actions}
 */

Actions.prototype.click = function (selector) {
  var hash = _.uniqueId('click');
  var cb = this._generateCallbackAssertion('click', 'click', selector, hash);
  this._addToActionQueue([selector, hash], 'click', cb);
  return this;
};

/**
 * Fills the fields of a form with given values.
 *
 * @param {string} selector
 * @param {string} value
 * @return {Actions}
 */

Actions.prototype.val = function (selector, value) {
  var hash = _.uniqueId('val');
  var cb = this._generateCallbackAssertion('val', 'val', selector + ' : ' + value, hash);
  this._addToActionQueue([selector, value, hash], 'val', cb);
  return this;
};

/**
 * Performs an HTTP request for opening a given location.
 * You can forge GET, POST, PUT, DELETE and HEAD requests.
 *
 * @param {string} locations
 * @param {Object} settings
 * @return {Actions}
 */

Actions.prototype.open = function (location, settings) {
  var hash = _.uniqueId('open');
  var cb = this._generateCallbackAssertion('open', 'open', location, hash);
  this._addToActionQueue([location, settings, hash], 'open', cb);
  return this;
};

/**
 * Waits until an element matching the provided
 * selector expression exists in remote DOM to process any next step.
 *
 * @param {string} selector
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitForElement = function (selector, timeout) {
  var hash = _.uniqueId('waitForElement');
  var cb = this._generateCallbackAssertion('waitForElement', 'waitForElement', selector + ' : ' + timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForElement', cb);
  return this;
};

/**
 *
 */

Actions.prototype._generateCallbackAssertion = function (key, type, value, hash, opts) {
  var cb = function (data) {
    if (data && data.key === key && !this.uuids[data.uuid]) {
      this.uuids[data.uuid] = true;
      reporter.emit('report:action', {
        value: data.value,
        type: type,
        uuid: data.uuid
      });
    }
  }.bind(this);
  return cb;
};

/**
 *
 */

Actions.prototype._addToActionQueue = function (opts, driverMethod, cb) {
  this.actionPromiseQueue.push(function () {
    var deferred = Q.defer();
    // add a generic identifier as the last argument to any action method call
    opts.push(this._guid());

    // check the method on the driver object && the callback function
    if (_.isFunction(this.driver[driverMethod]) &&  _.isFunction(cb)) {
      // call the method on the driver object
      this.driver[driverMethod].apply(this.driver, opts);
      deferred.resolve();
    } else {
      deferred.reject();
    }

    // listen to driver message events & apply the callback argument
    this.driver.events.on('driver:message', cb);
    return deferred.promise;
  }.bind(this));
  return this;
};

/**
 * Generates a random number
 * @return {integer}
 */

Actions.prototype._s4 = function () {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};

/**
 * Generates an uuid
 * @return {string}
 */

Actions.prototype._guid =function () {
  return this._s4() + this._s4() + '-' + this._s4() + '-' + this._s4() + '-' +
         this._s4() + '-' + this._s4() + this._s4() + this._s4();
}
