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

// ext. libs
var Q = require('q');
var uuid = require('node-uuid');

/**
 * @module
 */

var reporter = null;

/**
 * @constructor
 * @part Actions
 * @api
 */

var Actions = function () {
  this.uuids = {};
};

/**
 * Selector helper
 */

Actions.prototype.query = function (selector) {
  var that = !this.test ? this : this.test;
  that.lastChain.push('querying');
  that.selector = selector;
  that.querying = true;
  return this.test ? this : that;
};

Actions.prototype.$ = Actions.prototype.query;

/**
 * Triggers a mouse event on the first element found matching the provided selector.
 * Supported events are mouseup, mousedown, click, mousemove, mouseover and mouseout.
 * TODO: IMPLEMENT
 *
 * @method mouseEvent
 * @param {string} type
 * @param {string} selector
 * @chainable
 * @api
 */

Actions.prototype.mouseEvent = function (type, selector) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('mouseEvent', 'mouseEvent', type, selector, hash);
  this._addToActionQueue([type, selector, hash], 'mouseEvent', cb);
  return this;
};

/**
 * Sets HTTP_AUTH_USER and HTTP_AUTH_PW values for HTTP based authentication systems.
 *
 * If your site is behind a HTTP basic auth, you're able to set the username and the password
 *
 * ```javascript
 * test.setHttpAuth('OSWIN', 'rycbrar')
 *     .open('http://admin.therift.com');
 * ```
 *
 * Most of the time, you`re not storing your passwords within files that will be checked
 * in your vcs, for this scenario, you have two options:
 *
 * The first option is, to use daleks cli capabilities to generate config variables
 * from the command line, like this
 *
 * ```batch
 * $ dalek --vars USER=OSWIN,PASS=rycbrar
 * ```
 *
 * ```javascript
 * test.setHttpAuth(test.config.get('USER'), test.config.get('PASS'))
 *     .open('http://admin.therift.com');
 * ```
 *
 * The second option is, to use env variables to generate config variables
 * from the command line, like this
 *
 * ```batch
 * $ SET USER=OSWIN
 * $ SET PASS=rycbrar
 * $ dalek
 * ```
 *
 * ```javascript
 * test.setHttpAuth(test.config.get('USER'), test.config.get('PASS'))
 *     .open('http://admin.therift.com');
 * ```
 *
 * If both, dalek variables & env variables are set, the dalek variables win.
 * For more information about this, I recommend to check out the [configuration docs](/docs/config.html)
 *
 * @method setHttpAuth
 * @api
 * @param {string} username
 * @param {string} password
 * @return {Actions}
 */

Actions.prototype.setHttpAuth = function (username, password) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('setHttpAuth', 'setHttpAuth', username, password, hash);
  this._addToActionQueue([username, password, hash], 'setHttpAuth', cb);
  return this;
};

/**
 * Switches to an iFrame context
 *
 * Sometimes you encounter situation, where you need to drive/access an iFrame sitting in your page.
 * You can access such frames with this mehtod, but be aware of the fact, that the complete test
 *
 * ```html
 * <div>
 *   <iframe id="login" src="/login.html"/>
 * </div>
 * ```
 *
 * ```javascript
 *  test.open('http:adomain.withiframe.com')
 *    .title().is('Title of a page that embeds an iframe')
 *    .toIFrame('#login')
 *      .title().is('Title of a page that can be embedded as an iframe')
 *    .toParent()
 * ```
 *
 * @api
 * @method toFrame
 * @param {string} selector
 * @return {Actions}
 */

Actions.prototype.toFrame = function (selector) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('toFrame', 'toFrame', selector, hash);
  this._addToActionQueue([selector, hash], 'toFrame', cb);
  return this;
};

/**
 * End of IFrame context
 */

Actions.prototype.toParent = function () {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('toFrame', 'toFrame', null, hash);
  this._addToActionQueue([null, hash], 'toFrame', cb);
  return this;
};

/**
 * Change scope to a specific window context
 */

Actions.prototype.toWindow = function (name) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('toWindow', 'toWindow', name, hash);
  this._addToActionQueue([name, hash], 'toWindow', cb);
  return this;
};

/**
 * Go back to the parent window context
 */

Actions.prototype.toParentWindow = function () {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('toWindow', 'toWindow', null, hash);
  this._addToActionQueue([null, hash], 'toWindow', cb);
  return this;
};

/**
 * Waits until a function returns true to process any next step.
 *
 * You can also set a callback on timeout using the onTimeout argument,
 * and set the timeout using the timeout one, in milliseconds. The default timeout is set to 5000ms.
 *
 * @api
 * @method waitFor
 * @param {function} fn
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitFor = function (fn, timeout) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('waitFor', 'waitFor', fn, timeout, hash);
  this._addToActionQueue([fn, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitFor', cb);
  return this;
};

/**
 * Wait until a resource that matches the given testFx is loaded to process a next step.
 *
 * @api
 * @method waitForResource
 * @param {string} ressource
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitForResource = function (ressource, timeout) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('waitForResource', 'waitForResource', ressource, timeout, hash);
  this._addToActionQueue([ressource, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForResource', cb);
  return this;
};

/**
 * Waits until the passed text is present in the page contents before processing the immediate next step.
 *
 * @api
 * @method waitForText
 * @param {string} text
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitForText = function (text, timeout) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('waitUntilVisible', 'waitUntilVisible', text, timeout, hash);
  this._addToActionQueue([text, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForText', cb);
  return this;
};

/**
 * Waits until an element matching the provided selector expression is visible in the remote DOM to process a next step.
 *
 * @api
 * @method waitUntilVisible
 * @param {string} selector
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitUntilVisible = function (selector, timeout) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('waitUntilVisible', 'waitUntilVisible', selector, timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitUntilVisible', cb);
  return this;
};

/**
 * Waits until an element matching the provided selector expression is no longer visible in remote DOM to process a next step.
 *
 * ```javascript
 * ```
 *
 * @api
 * @method waitWhileVisible
 * @param {string} selector
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitWhileVisible = function (selector, timeout) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('waitWhileVisible', 'waitWhileVisible', selector, timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitWhileVisible', cb);
  return this;
};

/**
 * Take a screenshot of the current page.
 *
 * The pathname argument takes some placeholders that will be replaced
 * Placeholder:
 *
 *   - `:browser` - The browser name (e.g. ‘Chrome‘, ‘Safari‘, ‘Firefox‘, etc.)
 *   - `:version` -  The browser version (e.g. ‘10_0‘, ‘23_11_5‘, etc.)
 *   - `:os` - The operating system (e.g. `OSX`, `Windows`, `Linux`)
 *   - `:osVersion` - The operating system version (e.g `XP`, `7`, `10_8`, etc.)
 *   - `:viewport` - The current viewport in pixels (e.g. `w1024_h768`)
 *   - `:timestamp` - UNIX like timestapm (e.g. `637657345`)
 *   - `:date` - Current date in format MM_DD_YYYY (e.g. `12_24_2013`)
 *   - `:datetime` - Current datetime in format MM_DD_YYYY_HH_mm_ss (e.g. `12_24_2013_14_55_23`)
 *
 * ```javascript
 * // creates 'my/folder/my_file.png'
 * test.screenshot('my/folder/my_file');
 * // creates 'my/page/in/safari/homepage.png'
 * test.screenshot('my/page/in/:browser/homepage');
 * // creates 'my/page/in/safari_6_0_1/homepage.png'
 * test.screenshot('my/page/in/:browser_:version/homepage');
 * // creates 'my/page/in/safari_6_0_1/on/osx/homepage.png'
 * test.screenshot('my/page/in/:browser_:version/on/:os/homepage');
 * // creates 'my/page/in/safari_6_0_1/on/osx_10_8/homepage.png'
 * test.screenshot('my/page/in/:browser_:version/on/:os_:osVersion/homepage');
 * // creates 'my/page/at/w1024_h768/homepage.png'
 * test.screenshot('my/page/at/:viewport/homepage');
 * // creates 'my/page/at/637657345/homepage.png'
 * test.screenshot('my/page/in_time/:timestamp/homepage');
 * // creates 'my/page/at/12_24_2013/homepage.png'
 * test.screenshot('my/page/in_time/:date/homepage');
 * // creates 'my/page/at/12_24_2013_14_55_23/homepage.png'
 * test.screenshot('my/page/in_time/:datetime/homepage');
 * ```
 *
 * @api
 * @method screenshot
 * @param {string} pathname
 * @return {Actions}
 */

Actions.prototype.screenshot = function (pathname) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('screenshot', 'screenshot', pathname, hash);
  this._addToActionQueue(['', pathname, hash], 'screenshot', cb);
  return this;
};

/**
 * Pause steps suite execution for a given amount of time, and optionally execute a step on done.
 *
 * This makes sense, if you have a ticker for example, tht scrolls like every ten seconds
 * & you want to assure that the visible content changes every ten seconds
 *
 * ```javascript
 * test.open('http://myticker.org')
 *   .visible('.ticker-element:first', 'First ticker element is visible')
 *   .wait(10000)
 *   .visible('.ticker-element:nth-child(2)', 'Snd. ticker element is visible')
 *   .wait(10000)
 *   .visible('.ticker-element:last', 'Third ticker element is visible')
 *   .all.success('Ticker seems to work quite well');
 * ```
 * If no timeout argument is given, a default timeout of 5 seconds will be used
 *
 * ```javascript
 * test.open('http://myticker.org')
 *   .visible('.ticker-element:first', 'First ticker element is visible')
 *   .wait()
 *   .visible('.ticker-element:nth-child(2)', 'Snd. ticker element is visible')
 *   .wait()
 *   .visible('.ticker-element:last', 'Third ticker element is visible')
 *   .all.success('This ticker changed every 5 seconds, cool!');
 * ```
 *
 * @method wait
 * @api
 * @param {number} timeout in milliseconds
 * @return {Actions}
 */

Actions.prototype.wait = function (timeout) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('wait', 'wait', timeout, hash);
  this._addToActionQueue([(timeout ? parseInt(timeout, 10) : 5000), hash], 'wait', cb);
  return this;
};

/**
 * Reloads current page location.
 *
 * This is basically the same as hitting F5/refresh in your browser
 *
 * ```javascript
 * test.open('http://google.com')
 *   .refresh();
 * ```
 *
 * @method reload
 * @api
 * @return {Actions}
 */

Actions.prototype.reload = function () {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('reload', 'reload', '', hash);
  this._addToActionQueue([hash], 'reload', cb);
  return this;
};

/**
 * Moves a step forward in browser's history.
 *
 * This is basically the same as hitting the forward button in your browser
 *
 * ```javascript
 * test.open('http://google.com')
 *   .open('https://github.com')
 *   .url.is('https://github.com/', 'We are at GitHub')
 *   .back()
 *   .url.is('http://google.com', 'We are at Google!')
 *   .forward()
 *   .url.is('https://github.com/', 'Back at GitHub! Timetravel FTW');
 * ```
 *
 * @method forward
 * @api
 * @return {Actions}
 */

Actions.prototype.forward = function () {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('forward', 'forward', '', hash);
  this._addToActionQueue([hash], 'forward', cb);
  return this;
};

/**
 * Moves back a step in browser's history.
 *
 * This is basically the same as hitting the back button in your browser
 *
 * ```javascript
 * test.open('http://google.com')
 *   .open('https://github.com')
 *   .url.is('https://github.com/', 'We are at GitHub')
 *   .back()
 *   .url.is('http://google.com', 'We are at Google!')
 *   .forward()
 *   .url.is('https://github.com/', 'Back at GitHub! Timetravel FTW');
 * ```
 *
 * @method back
 * @api
 * @return {Actions}
 */

Actions.prototype.back = function () {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('back', 'back', '', hash);
  this._addToActionQueue([hash], 'back', cb);
  return this;
};

/**
 * Performs a click on the element matching the provided selector expression.
 *
 * If we take Daleks homepage (the one you're probably visiting right now),
 * the HTML looks something like this
 *
 * ```html
 * <nav>
 *   <ul>
 *     <li><a id="homeapge" href="/index.html">DalekJS</a></li>
 *     <li><a id="docs"  href="/docs.html">Documentation</a></li>
 *     <li><a id="faq" href="/faq.html">F.A.Q</a></li>
 *   </ul>
 * </nav>
 * ```
 *
 * ```javascript
 * test.open('http://dalekjs.com')
 *     .click('#faq')
 *     .title().is('DalekJS - Frequently asked questions', 'What the F.A.Q.');
 * ```
 *
 * By default, this performs a left click.
 *
 * @api
 * @method click
 * @param {string} selector
 * @return {Actions}
 */

Actions.prototype.click = function (selector) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('click', 'click', selector, hash);
  this._addToActionQueue([selector, hash], 'click', cb);
  return this;
};


Actions.prototype.submit = function (selector) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('submit', 'submit', selector, hash);
  this._addToActionQueue([selector, hash], 'submit', cb);
  return this;
};

/**
 * Fills the fields of a form with given values.
 *
 * ```html
 * <nav>
 *   <ul>
 *     <li><a id="homeapge" href="/index.html">DalekJS</a></li>
 *     <li><a id="docs"  href="/docs.html">Documentation</a></li>
 *     <li><a id="faq" href="/faq.html">F.A.Q</a></li>
 *   </ul>
 * </nav>
 * ```
 *
 * ```javascript
 * test.open('http://dalekjs.com')
 *     .setValue('#ijustwannahaveavalue', 'a value')
 *     .title().is('DalekJS - Frequently asked questions', 'What the F.A.Q.');
 * ```
 *
 * @api
 * @method setValue
 * @param {string} selector
 * @param {string} value
 * @return {Actions}
 */

Actions.prototype.setValue = function (selector, value) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('setValue', 'setValue', selector + ' : ' + value, hash);
  this._addToActionQueue([selector, value, hash], 'setValue', cb);
  return this;
};

/**
 * Performs an HTTP request for opening a given location.
 * You can forge GET, POST, PUT, DELETE and HEAD requests.
 *
 * ```javascript
 * test.open('http://dalekjs.com')
 *     .url().is('http://dalekjs.com', 'DalekJS I'm in you');
 * ```
 *
 * @api
 * @method open
 * @param {string} locations
 * @param {Object} settings
 * @return {Actions}
 */

Actions.prototype.open = function (location, settings) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('open', 'open', location, hash);
  this._addToActionQueue([location, settings, hash], 'open', cb);
  return this;
};

/**
 *
 *
 * @api
 * @method type
 * @param {string} keystrokes
 * @return chainable
 */

Actions.prototype.type = function (selector, keystrokes) {
  var hash = uuid.v4();

  if (this.querying === true) {
    keystrokes = selector;
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('type', 'type', selector, keystrokes, hash);
  this._addToActionQueue([selector, keystrokes], 'type', cb);
  return this;
};

/**
 * Resizes the browser window
 */

Actions.prototype.resize = function (dimensions) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('resize', 'resize', dimensions, hash);
  this._addToActionQueue([dimensions, hash], 'resize', cb);
  return this;
};

/**
 * Resizes the browser window
 */

Actions.prototype.setCookie = function (name, contents) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('setCookie', 'setCookie', name, contents, hash);
  this._addToActionQueue([name, contents, hash], 'setCookie', cb);
  return this;
};

/**
 * Waits until an element matching the provided
 * selector expression exists in remote DOM to process any next step.
 *
 * @api
 * @method waitForElement
 * @param {string} selector
 * @param {number} timeout
 * @return {Actions}
 */

Actions.prototype.waitForElement = function (selector, timeout) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('waitForElement', 'waitForElement', selector + ' : ' + timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForElement', cb);
  return this;
};

/**
 *
 * @private
 */

Actions.prototype._generateCallbackAssertion = function (key, type) {
  var cb = function (data) {
    if (data && data.key === key && !this.uuids[data.uuid]) {
      if ((data && data.value) || data.value === null) {
        data.value = '';
      }

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
 * @private
 */

Actions.prototype._addToActionQueue = function (opts, driverMethod, cb) {
  this.actionPromiseQueue.push(function () {
    var deferred = Q.defer();
    // add a generic identifier as the last argument to any action method call
    opts.push(uuid.v4());
    // check the method on the driver object && the callback function
    if (typeof(this.driver[driverMethod]) === 'function' && typeof(cb) === 'function') {
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

module.exports = function (opts) {
  reporter = opts.reporter;
  return Actions;
};
