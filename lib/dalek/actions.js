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
var uuid = require('./uuid');
var cheerio = require('cheerio');

// int. global
var reporter = null;

/**
 * Actions are a way to control your browsers, e.g. simulate user interactions
 * like clicking elements, open urls, filling out input fields, etc.
 *
 * @class Actions
 * @constructor
 * @part Actions
 * @api
 */

var Actions = function () {
  this.uuids = {};
};

/**
 * It can be really cumbersome to repeat selectors all over when performing
 * multiple actions or assertions on the same element(s).
 * When you use the query method (or its alias $), you're able to specify a
 * selector once instead of repeating it all over the place.
 *
 * So, instead of writing this:
 *
 * ```javascript
 * test.open('http://doctorwhotv.co.uk/')
 *     .assert.text('#nav').is('Navigation')
 *     .assert.visible('#nav')
 *     .assert.attr('#nav', 'data-nav', 'true')
 *     .click('#nav')
 *     .done();
 * ```
 *
 * you can write this:
 *
 * ```javascript
 * test.open('http://doctorwhotv.co.uk/')
 *     .query('#nav')
 *       .assert.text().is('Navigation')
 *       .assert.visible()
 *       .assert.attr('data-nav', 'true')
 *       .click()
 *     .end()
 *     .done();
 * ```
 *
 * Always make sure to terminate it with the [end](assertions.html#meth-end) method!
 *
 * @api
 * @method query
 * @param {string} selector Selector of the element to query
 * @chainable
 */

Actions.prototype.query = function (selector) {
  var that = !this.test ? this : this.test;
  that.lastChain.push('querying');
  that.selector = selector;
  that.querying = true;
  return this.test ? this : that;
};

/**
 * Alias of query
 *
 * @api
 * @method $
 * @param {string} selector Selector of the element to query
 * @chainable
 */

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
 */

Actions.prototype.mouseEvent = function (type, selector) {
  var hash = uuid();
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
 * TODO: IMPLEMENT
 *
 * @method setHttpAuth
 * @param {string} username
 * @param {string} password
 * @return {Actions}
 */

Actions.prototype.setHttpAuth = function (username, password) {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('setHttpAuth', 'setHttpAuth', username, password, hash);
  this._addToActionQueue([username, password, hash], 'setHttpAuth', cb);
  return this;
};

/**
 * Switches to an iFrame context
 *
 * Sometimes you encounter situations, where you need to drive/access an iFrame sitting in your page.
 * You can access such frames with this method, but be aware of the fact, that the complete test context
 * than switches to the iframe context, every action and assertion will be executed within the iFrame context.
 * Btw.: The domain of the IFrame can be whatever you want, this method has no same origin policy restrictions.
 *
 * If you wan't to get back to the parents context, you have to use the [toParent](#meth-toParent) method.
 *
 * ```html
 * <div>
 *   <iframe id="login" src="/login.html"/>
 * </div>
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.withiframe.com')
 *    .assert.title().is('Title of a page that embeds an iframe')
 *    .toFrame('#login')
 *      .assert.title().is('Title of a page that can be embedded as an iframe')
 *    .toParent()
 *    .done();
 * ```
 *
 * > NOTE: Buggy in Firefox
 *
 * @api
 * @method toFrame
 * @param {string} selector Selector of the frame to switch to
 * @chainable
 */

Actions.prototype.toFrame = function (selector) {
  var hash = uuid();

  if (this.querying === true) {
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('toFrame', 'toFrame', selector, hash);
  this._addToActionQueue([selector, hash], 'toFrame', cb);
  return this;
};

/**
 * Switches back to the parent page context when the test context has been
 * switched to an iFrame context
 *
 * ```html
 * <div>
 *   <iframe id="login" src="/login.html"/>
 * </div>
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.withiframe.com')
 *    .assert.title().is('Title of a page that embeds an iframe')
 *    .toFrame('#login')
 *      .assert.title().is('Title of a page that can be embedded as an iframe')
 *    .toParent()
 *    .assert.title().is('Title of a page that embeds an iframe')
 *    .done();
 * ```
 *
 * > NOTE: Buggy in Firefox
 *
 * @api
 * @method toParent
 * @chainable
 */

Actions.prototype.toParent = function () {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('toFrame', 'toFrame', null, hash);
  this._addToActionQueue([null, hash], 'toFrame', cb);
  return this;
};

/**
 * Switches to a different window context
 *
 * Sometimes you encounter situations, where you need to access a different window, like popup windows.
 * You can access such windows with this method, but be aware of the fact, that the complete test context
 * than switches to the window context, every action and assertion will be executed within the chosen window context.
 * Btw.: The domain of the window can be whatever you want, this method has no same origin policy restrictions.
 *
 * If you want to get back to the parents context, you have to use the [toParentWindow](#meth-toParentWindow) method.
 *
 * ```html
 * <div>
 *   <a onclick="window.open('http://google.com','goog','width=480, height=300')">Open Google</a>
 * </div>
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *    .assert.title().is('Title of a page that can open a popup window')
 *    .toWindow('goog')
 *      .assert.title().is('Google')
 *    .toParentWindow()
 *    .done();
 * ```
 *
 * > NOTE: Buggy in Firefox
 *
 * @api
 * @method toWindow
 * @param {string} name Name of the window to switch to
 * @chainable
 */

Actions.prototype.toWindow = function (name) {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('toWindow', 'toWindow', name, hash);
  this._addToActionQueue([name, hash], 'toWindow', cb);
  return this;
};

/**
 * Switches back to the parent window context when the test context has been
 * switched to a different window context
 *
 * ```html
 * <div>
 *   <a onclick="window.open('http://google.com','goog','width=480, height=300')">Open Google</a>
 * </div>
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *    .assert.title().is('Title of a page that can open a popup window')
 *    .toWindow('goog')
 *      .assert.title().is('Google')
 *    .toParentWindow()
 *    .assert.title().is('Title of a page that can open a popup window')
 *    .done();
 * ```
 *
 * > NOTE: Buggy in Firefox
 *
 * @api
 * @method toParentWindow
 * @chainable
 */

Actions.prototype.toParentWindow = function () {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('toWindow', 'toWindow', null, hash);
  this._addToActionQueue([null, hash], 'toWindow', cb);
  return this;
};

/**
 * Wait until a resource that matches the given testFx is loaded to process a next step.
 *
 * TODO: IMPLEMENT
 *
 * @method waitForResource
 * @param {string} ressource URL of the ressource that should be waited for
 * @param {number} timeout Timeout in miliseconds
 * @chainable
 */

Actions.prototype.waitForResource = function (ressource, timeout) {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('waitForResource', 'waitForResource', ressource, timeout, hash);
  this._addToActionQueue([ressource, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForResource', cb);
  return this;
};

/**
 * Waits until the passed text is present in the page contents before processing the immediate next step.
 *
 * TODO: IMPLEMENT
 *
 * @method waitForText
 * @param {string} text Text to be waited for
 * @param {number} timeout Timeout in miliseconds
 * @chainable
 */

Actions.prototype.waitForText = function (text, timeout) {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('waitForText', 'waitForText', text, timeout, hash);
  this._addToActionQueue([text, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForText', cb);
  return this;
};

/**
 * Waits until an element matching the provided selector expression is visible in the remote DOM to process a next step.
 *
 * TODO: IMPLEMENT
 *
 * @method waitUntilVisible
 * @param {string} selector Selector of the element that should be waited to become invisible
 * @param {number} timeout Timeout in miliseconds
 * @chainable
 */

Actions.prototype.waitUntilVisible = function (selector, timeout) {
  var hash = uuid();

  if (this.querying === true) {
    timeout = selector;
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('waitUntilVisible', 'waitUntilVisible', selector, timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitUntilVisible', cb);
  return this;
};

/**
 * Waits until an element matching the provided selector expression is no longer visible in remote DOM to process a next step.
 *
 * TODO: IMPLEMENT
 *
 * @method waitWhileVisible
 * @param {string} selector Selector of the element that should be waited to become visible
 * @param {number} timeout Timeout in miliseconds
 * @chainable
 */

Actions.prototype.waitWhileVisible = function (selector, timeout) {
  var hash = uuid();

  if (this.querying === true) {
    timeout = selector;
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('waitWhileVisible', 'waitWhileVisible', selector, timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitWhileVisible', cb);
  return this;
};

/**
 * Take a screenshot of the current page or css element.
 *
 * The pathname argument takes some placeholders that will be replaced
 * Placeholder:
 *
 *   - `:browser` - The browser name (e.g. 'Chrome', 'Safari', 'Firefox', etc.)
 *   - `:version` -  The browser version (e.g. '10_0', '23_11_5', etc.)
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
 * @param {string} pathname Name of the folder and file the screenshot should be saved to
 * @param {string} css selector of element should be screeshoted
 * @return chainable
 */

Actions.prototype.screenshot = function (pathname, selector) {
  var hash = uuid();

  if (this.querying === true) {
    selector = this.selector;
  }

  var opts = {
    realpath : undefined,
    selector : selector
  };

  this.screenshotParams = opts;

  var screenshotcb = this._generatePlainCallback('screenshot', hash, opts, 'realpath', typeof selector === 'undefined');
  this._addToActionQueue(['', pathname, hash], 'screenshot', screenshotcb.bind(this));

  if (selector) {
    var imagecutcb = this._generateCallbackAssertion('imagecut', 'screenshot element', opts, hash);
    this._addToActionQueue([opts, hash], 'imagecut', imagecutcb);
  }

  this.reporter.emit('report:screenshot', {
    'pathname' : pathname,
    'uuid' : hash
  });

  return this;
};

/**
 * Generates a callback that will be fired when the action has been completed.
 * The callback will then store value into opts variable.
 *
 * @method _generateCallbackAssertion
 * @param {string} type Type of the action (normalle the actions name)
 * @param {string} hash Unique id of the action
 * @param {string} opts Variable where will be stored result of execution of the action
 * @param {string} key Name of the property where will be stored result of execution of the action
 * @return {function} The generated callback function
 * @private
 */
Actions.prototype._generatePlainCallback = function (type, hash, opts, property, last) {
  var cb = function (data) {
    if (data.hash === hash && data.key ===  type && !this.uuids[data.uuid]) {
      if (typeof opts === 'object' && typeof property === 'string') {
        opts[property] = data.value;
      }
      if (data.key ===  'screenshot') {
        this.reporter.emit('report:action', {
          value: data.value,
          type: type,
          uuid: data.uuid
        });
      }

      if (last) {
        this.uuids[data.uuid] = true;
      }
    }
  };
  return cb;
};

/**
 * Pause steps suite execution for a given amount of time, and optionally execute a step on done.
 *
 * This makes sense, if you have a ticker for example, tht scrolls like every ten seconds
 * & you want to assure that the visible content changes every ten seconds
 *
 * ```javascript
 * test.open('http://myticker.org')
 *   .assert.visible('.ticker-element:first-child', 'First ticker element is visible')
 *   .wait(10000)
 *   .assert.visible('.ticker-element:nth-child(2)', 'Snd. ticker element is visible')
 *   .wait(10000)
 *   .assert.visible('.ticker-element:last-child', 'Third ticker element is visible')
 *   .done();
 * ```
 * If no timeout argument is given, a default timeout of 5 seconds will be used
 *
 * ```javascript
 * test.open('http://myticker.org')
 *   .assert.visible('.ticker-element:first-child', 'First ticker element is visible')
 *   .wait()
 *   .assert.visible('.ticker-element:nth-child(2)', 'Snd. ticker element is visible')
 *   .wait()
 *   .assert.visible('.ticker-element:last-child', 'Third ticker element is visible')
 *   .done();
 * ```
 *
 * @api
 * @method wait
 * @param {number} timeout in milliseconds
 * @chainable
 */

Actions.prototype.wait = function (timeout) {
  var hash = uuid();
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
 *   .reload()
 *   .done();
 * ```
 *
 * @api
 * @method reload
 * @chainable
 */

Actions.prototype.reload = function () {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('refresh', 'refresh', '', hash);
  this._addToActionQueue([hash], 'refresh', cb);
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
 *   .assert.url.is('https://github.com/', 'We are at GitHub')
 *   .back()
 *   .assert.url.is('http://google.com', 'We are at Google!')
 *   .forward()
 *   .assert.url.is('https://github.com/', 'Back at GitHub! Timetravel FTW')
 *   .done();
 * ```
 *
 * @api
 * @method forward
 * @chainable
 */

Actions.prototype.forward = function () {
  var hash = uuid();
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
 *   .assert.url.is('https://github.com/', 'We are at GitHub')
 *   .back()
 *   .assert.url.is('http://google.com', 'We are at Google!')
 *   .forward()
 *   .assert.url.is('https://github.com/', 'Back at GitHub! Timetravel FTW');
 *   .done();
 * ```
 *
 * @api
 * @method back
 * @chainable
 */

Actions.prototype.back = function () {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('back', 'back', '', hash);
  this._addToActionQueue([hash], 'back', cb);
  return this;
};

/**
 * Performs a click on the element matching the provided selector expression.
 *
 * If we take Daleks homepage (the one you're probably visiting right now),
 * the HTML looks something like this (it does not really, but hey, lets assume this for a second)
 *
 * ```html
 * <nav>
 *   <ul>
 *     <li><a id="homeapge" href="/index.html">DalekJS</a></li>
 *     <li><a id="docs" href="/docs.html">Documentation</a></li>
 *     <li><a id="faq" href="/faq.html">F.A.Q</a></li>
 *   </ul>
 * </nav>
 * ```
 *
 * ```javascript
 * test.open('http://dalekjs.com')
 *     .click('#faq')
 *     .assert.title().is('DalekJS - Frequently asked questions', 'What the F.A.Q.')
 *     .done();
 * ```
 *
 * By default, this performs a left click.
 * In the future it might become the ability to also execute a "right button" click.
 *
 * > Note: Does not work correctly in Firefox when used on `<select>` & `<option>` elements
 *
 * @api
 * @method click
 * @param {string} selector Selector of the element to be clicked
 * @chainable
 */

Actions.prototype.click = function (selector) {
  var hash = uuid();

  if (this.querying === true) {
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('click', 'click', selector, hash);
  this._addToActionQueue([selector, hash], 'click', cb);
  return this;
};

/**
 * Submits a form.
 *
 * ```html
 * <form id="skaaro" action="skaaro.php" method="GET">
 *   <input type="hidden" name="intheshadows" value="itis"/>
 *   <input type="text" name="truth" id="truth" value=""/>
 * </form>
 * ```
 *
 * ```javascript
 * test.open('http://home.dalek.com')
 *     .type('#truth', 'out there is')
 *     .submit('#skaaro')
 *     .done();
 * ```
 *
 * > Note: Does not work in Firefox yet
 *
 * @api
 * @method submit
 * @param {string} selector Selector of the form to be submitted
 * @chainable
 */

Actions.prototype.submit = function (selector) {
  var hash = uuid();

  if (this.querying === true) {
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('submit', 'submit', selector, hash);
  this._addToActionQueue([selector, hash], 'submit', cb);
  return this;
};

/**
 * Performs an HTTP request for opening a given location.
 * You can forge GET, POST, PUT, DELETE and HEAD requests.
 *
 * Basically the same as typing a location into your browsers URL bar and
 * hitting return.
 *
 * ```javascript
 * test.open('http://dalekjs.com')
 *     .assert.url().is('http://dalekjs.com', 'DalekJS I\'m in you')
 *     .done();
 * ```
 *
 * @api
 * @method open
 * @param {string} location URL of the page to open
 * @chainable
 */

Actions.prototype.open = function (location) {
  //see if we should prepend the location with the configured base url is available and needed
  if(location.substr(0, 1) === '/' && this.driver.config.config.baseUrl) {
    location = this.driver.config.config.baseUrl + location;
  }

  var hash = uuid();
  var cb = this._generateCallbackAssertion('open', 'open', location, hash);
  this._addToActionQueue([location, hash], 'open', cb);
  return this;
};

/**
 * Types a text into an input field or text area.
 * And yes, it really types, character for character, like you would
 * do when using your keyboard.
 *
 *
 * ```html
 * <form id="skaaro" action="skaaro.php" method="GET">
 *   <input type="hidden" name="intheshadows" value="itis"/>
 *   <input type="text" name="truth" id="truth" value=""/>
 * </form>
 * ```
 *
 * ```javascript
 * test.open('http://home.dalek.com')
 *     .type('#truth', 'out there is')
 *     .assert.val('#truth', 'out there is', 'Text has been set')
 *     .done();
 * ```
 *
 * You can also send special keys using unicode.
 *
 *  * ```javascript
 * test.open('http://home.dalek.com')
 *     .type('#truth', 'out \uE008there\uE008 is')
 *     .assert.val('#truth', 'out THERE is', 'Text has been set')
 *     .done();
 * ```
 * You can go [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value) to read up on special keys and unicodes for them (note that a code of U+EXXX is actually written in code as \uEXXX).
 *
 * > Note: Does not work correctly in Firefox with special keys
 *
 * @api
 * @method type
 * @param {string} selector Selector of the form field to be filled
 * @param {string} keystrokes Text to be applied to the element
 * @chainable
 */

Actions.prototype.type = function (selector, keystrokes) {
  var hash = uuid();

  if (this.querying === true) {
    keystrokes = selector;
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('type', 'type', selector, keystrokes, hash);
  this._addToActionQueue([selector, keystrokes], 'type', cb);
  return this;
};

/**
 * This acts just like .type() with a key difference.
 * This action can be used on non-input elements (useful for test site wide keyboard shortcuts and the like).
 * So assumeing we have a keyboard shortcut that display an alert box, we could test that with something like this:
 *
 * ```javascript
 * test.open('http://home.dalek.com')
 *     .sendKeys('body', '\uE00C')
 *     .assert.dialogText('press the escape key give this alert text')
 *     .done();
 * ```
 *
 *
 * > Note: Does not work correctly in Firefox with special keys
 *
 * @api
 * @method sendKeys
 * @param {string} selector Selector of the form field to be filled
 * @param {string} keystrokes Text to be applied to the element
 * @chainable
 */

Actions.prototype.sendKeys = function (selector, keystrokes) {
  var hash = uuid();

  if (this.querying === true) {
    keystrokes = selector;
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('sendKeys', 'sendKeys', selector, keystrokes, hash);
  this._addToActionQueue([selector, keystrokes], 'sendKeys', cb);
  return this;
};

/**
 * Types a text into the text input field of a prompt dialog.
 * Like you would do when using your keyboard.
 *
 * ```html
 * <div>
 *   <a id="aquestion" onclick="this.innerText = window.prompt('Your favourite companion:')">????</a>
 * </div>
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     .click('#aquestion')
 *     .answer('Rose')
 *     .assert.text('#aquestion').is('Rose', 'Awesome she was!')
 *     .done();
 * ```
 *
 *
 * > Note: Does not work in Firefox & PhantomJS
 *
 * @api
 * @method answer
 * @param {string} keystrokes Text to be applied to the element
 * @return chainable
 */

Actions.prototype.answer = function (keystrokes) {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('promptText', 'promptText', keystrokes, hash);
  this._addToActionQueue([keystrokes, hash], 'promptText', cb);
  return this;
};

/**
 * Executes a JavaScript function within the browser context
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     .execute(function () {
 *       window.myFramework.addRow('foo');
 *       window.myFramework.addRow('bar');
 *     })
 *     .done();
 * ```
 *
 * You can also apply arguments to the function
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     .execute(function (paramFoo, aBar) {
 *       window.myFramework.addRow(paramFoo);
 *       window.myFramework.addRow(aBar);
 *     }, 'foo', 'bar')
 *     .done();
 * ```
 *
 * > Note: Buggy in Firefox
 *
 * @api
 * @method execute
 * @param {function} script JavaScript function that should be executed
 * @return chainable
 */

Actions.prototype.execute = function (script) {
  var hash = uuid();
  var args = [this.contextVars].concat(Array.prototype.slice.call(arguments, 1) || []);
  var cb = this._generateCallbackAssertion('execute', 'execute', script, args, hash);
  this._addToActionQueue([script, args, hash], 'execute', cb);
  return this;
};

/**
 * Waits until a function returns true to process any next step.
 *
 * You can also set a callback on timeout using the onTimeout argument,
 * and set the timeout using the timeout one, in milliseconds. The default timeout is set to 5000ms.
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     .waitFor(function () {
 *       return window.myCheck === true;
 *     })
 *     .done();
 * ```
 *
 * You can also apply arguments to the function, as well as a timeout
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     .waitFor(function (aCheck) {
 *       return window.myThing === aCheck;
 *     }, ['arg1', 'arg2'], 10000)
 *     .done();
 * ```
 *
 * > Note: Buggy in Firefox
 *
 * @method waitFor
 * @param {function} fn Async function that resolves an promise when ready
 * @param {array} args Additional arguments
 * @param {number} timeout Timeout in miliseconds
 * @chainable
 * @api
 */

Actions.prototype.waitFor = function (script, args, timeout) {
  var hash = uuid();
  timeout = timeout || 5000;
  args = [this.contextVars].concat(Array.prototype.slice.call(arguments, 1) || []);
  var cb = this._generateCallbackAssertion('waitFor', 'waitFor', script, args, timeout, hash);
  this._addToActionQueue([script, args, timeout, hash], 'waitFor', cb);
  return this;
};

/**
 * Accepts an alert/prompt/confirm dialog. This is basically the same actions as when
 * you are clicking okay or hitting return in one of that dialogs.
 *
 * ```html
 * <div>
 *   <a id="attentione" onclick="window.alert('Alonsy!')">ALERT!ALERT!</a>
 * </div>
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     // alert appears
 *     .click('#attentione')
 *     // alert is gone
 *     .accept()
 *     .done();
 * ```
 *
 * > Note: Does not work in Firefox & PhantomJS
 *
 * @api
 * @method accept
 * @return chainable
 */

Actions.prototype.accept = function () {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('acceptAlert', 'acceptAlert', hash);
  this._addToActionQueue([hash], 'acceptAlert', cb);
  return this;
};

/**
 * Dismisses an prompt/confirm dialog. This is basically the same actions as when
 * you are clicking cancel in one of that dialogs.
 *
 * ```html
 * <div>
 *   <a id="nonono" onclick="(this.innerText = window.confirm('No classic doctors in the 50th?') ? 'Buh!' : ':(') ">What!</a>
 * </div>
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     // prompt appears
 *     .click('#nonono')
 *     // prompt is gone
 *     .dismiss()
 *     .assert.text('#nonono').is(':(', 'So sad')
 *     .done();
 * ```
 *
 * > Note: Does not work in Firefox & PhantomJS
 *
 * @api
 * @method dismiss
 * @return chainable
 */

Actions.prototype.dismiss = function () {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('dismissAlert', 'dismissAlert', hash);
  this._addToActionQueue([hash], 'dismissAlert', cb);
  return this;
};

/**
 * Resizes the browser window to a set of given dimensions (in px).
 * The default configuration of dalek opening pages is a width of 1280px
 * and a height of 1024px. You can specify your own default in the configuration.
 *
 * ```html
 * <div>
 *   <span id="magicspan">The span in the fireplace</span>
 * </div>
 * ```
 *
 * ```css
 * #magicspan {
 *   display: inline;
 * }
 *
 * // @media all and (max-width: 500px) and (min-width: 300px)
 * #magicspan {
 *   display: none;
 * }
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     .assert.visible('#magicspan', 'Big screen, visible span')
 *     .resize({width: 400, height: 500})
 *     .assert.notVisible('#magicspan', 'Small screen, no visible span magic!')
 *     .done();
 * ```
 *
 *
 * > Note: Does not work in Firefox
 *
 * @api
 * @method resize
 * @param {object} dimensions Width and height as properties to apply
 * @chainable
 */

Actions.prototype.resize = function (dimensions) {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('resize', 'resize', dimensions, hash);
  this._addToActionQueue([dimensions, hash], 'resize', cb);
  return this;
};

/**
 * Maximizes the browser window.
 *
 * ```html
 * <div>
 *   <span id="magicspan">The span in the fireplace</span>
 * </div>
 * ```
 *
 * ```css
 * #magicspan {
 *   display: inline;
 * }
 *
 * @media all and (max-width: 500px) and (min-width: 300px) {
 *   #magicspan {
 *     display: none;
 *   }
 * }
 * ```
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *     .resize({width: 400, height: 500})
 *     .assert.notVisible('#magicspan', 'Small screen, no visible span magic!')
 *     .maximize()
 *     .assert.visible('#magicspan', 'Big screen, visible span')
 *     .done();
 * ```
 *
 * > Note: Does not work in Firefox and PhantomJS
 *
 * @api
 * @method maximize
 * @chainable
 */

Actions.prototype.maximize = function () {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('maximize', 'maximize', hash);
  this._addToActionQueue([hash], 'maximize', cb);
  return this;
};

/**
 * Sets a cookie.
 * More configuration options will be implemented in the future,
 * by now, you can only set a cookie with a specific name and contents.
 * This will be a domain wide set cookie.
 *
 * ```javascript
 *  test.open('http://adomain.com')
 *      .setCookie('my_cookie_name', 'my=content')
 *      .done();
 * ```
 *
 * @api
 * @method setCookie
 * @chainable
 */

Actions.prototype.setCookie = function (name, contents) {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('setCookie', 'setCookie', name, contents, hash);
  this._addToActionQueue([name, contents, hash], 'setCookie', cb);
  return this;
};

/**
 * Waits until an element matching the provided
 * selector expression exists in remote DOM to process any next step.
 *
 * Lets assume we have a ticker that loads its contents via AJAX,
 * and appends new elements, when the call has been successfully answered:
 *
 * ```javascript
 * test.open('http://myticker.org')
 *   .assert.text('.ticker-element:first-child', 'First!', 'First ticker element is visible')
 *   // now we load the next ticker element, defsult timeout is 5 seconds
 *   .waitForElement('.ticker-element:nth-child(2)')
 *   .assert.text('.ticker-element:nth-child(2)', 'Me snd. one', 'Snd. ticker element is visible')
 *   // Lets assume that this AJAX call can take longer, so we raise the default timeout to 10 seconds
 *   .waitForElement('.ticker-element:last-child', 10000)
 *   .assert.text('.ticker-element:last-child', 'Me, third one!', 'Third ticker element is visible')
 *   .done();
 * ```
 *
 * @api
 * @method waitForElement
 * @param {string} selector Selector that matches the element to wait for
 * @param {number} timeout Timeout in milliseconds
 * @chainable
 */

Actions.prototype.waitForElement = function (selector, timeout) {
  var hash = uuid();

  if (this.querying === true) {
    timeout = selector;
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('waitForElement', 'waitForElement', selector + ' : ' + timeout, hash);
  this._addToActionQueue([selector, (timeout ? parseInt(timeout, 10) : 5000), hash], 'waitForElement', cb);
  return this;
};

/**
 * Fills the fields of a form with given values.
 *
 * ```html
 * <input type="text" value="not really a value" id="ijustwannahaveavalue"/>
 * ```
 *
 * ```javascript
 * test.open('http://dalekjs.com')
 *     .setValue('#ijustwannahaveavalue', 'a value')
 *     .assert.val('#ijustwannahaveavalue', 'a value', 'Value is changed');
 * ```
 *
 * @api
 * @method setValue
 * @param {string} selector
 * @param {string} value
 * @return {Actions}
 */

Actions.prototype.setValue = function (selector, value) {
  var hash = uuid();

  if (this.querying === true) {
    value = selector;
    selector = this.selector;
  }

  var cb = this._generateCallbackAssertion('setValue', 'setValue', selector + ' : ' + value, hash);
  this._addToActionQueue([selector, value, hash], 'setValue', cb);
  return this;
};

// LOG (May should live in its own module)
// ---------------------------------------

Actions.prototype.logger = {};

/**
 * Logs a part of the remote dom
 *
 * ```html
 * <body>
 *   <div id="smth">
 *     <input type="hidden" value="not really a value" id="ijustwannahaveavalue"/>
 *   </div>
 * </body>
 * ```
 *
 * ```javascript
 * test.open('http://dalekjs.com/guineapig')
 *     .log.dom('#smth')
 *     .done();
 * ```
 *
 * Will output this:
 *
 * ```html
 *  DOM: #smth <input type="hidden" value="not really a value" id="ijustwannahaveavalue"/>
 * ```

 *
 * @api
 * @method log.dom
 * @param {string} selector CSS selector
 * @chainable
 */

Actions.prototype.logger.dom = function (selector) {
  var hash = uuid();

  var cb = function logDomCb (data) {
    if (data && data.key === 'source' && !this.uuids[data.uuid]) {
      this.uuids[data.uuid] = true;
      var $ = cheerio.load(data.value);
      var result = selector ? $(selector).html() : $.html();
      selector = selector ? selector : ' ';
      result = !result ? ' Not found' : result;
      this.reporter.emit('report:log:user', 'DOM: ' + selector + ' ' + result);
    }
  }.bind(this);

  this._addToActionQueue([hash], 'source', cb);
  return this;
};

/**
 * Logs a user defined message
 *
 * ```javascript
 * test.open('http://dalekjs.com/guineapig')
 *     .execute(function () {
 *       this.data('aKey', 'aValue');
 *     })
 *     .log.message(function () {
 *       return test.data('aKey'); // outputs MESSAGE: 'aValue'
 *     })
 *     .done();
 * ```
 *
 * 'Normal' messages can be logged too:
 *
 * ```javascript
 * test.open('http://dalekjs.com/guineapig')
 *     .log.message('FooBar') // outputs MESSAGE: FooBar
 *     .done();
 * ```
 *
 * @api
 * @method log.message
 * @param {function|string} message
 * @chainable
 */

Actions.prototype.logger.message = function (message) {
  var hash = uuid();

  var cb = function logMessageCb (data) {
    if (data && data.key === 'noop' && !this.uuids[data.hash]) {
      this.uuids[data.hash] = true;
      var result = (typeof(data.value) === 'function') ? data.value.bind(this)() : data.value;
      this.reporter.emit('report:log:user', 'MESSAGE: ' + result);
    }
  }.bind(this);

  this._addToActionQueue([message, hash], 'noop', cb);
  return this;
};

/**
 * Generates a callback that will be fired when the action has been completed.
 * The callback itself will then validate the answer and will also emit an event
 * that the action has been successfully executed.
 *
 * @method _generateCallbackAssertion
 * @param {string} key Unique key of the action
 * @param {string} type Type of the action (normalle the actions name)
 * @return {function} The generated callback function
 * @private
 */

Actions.prototype._generateCallbackAssertion = function (key, type) {
  var cb = function (data) {
    if (data && data.key === key && !this.uuids[data.uuid]) {
      if (!data || (data.value && data.value === null)) {
        data.value = '';
      }

      if (key === 'execute') {
        Object.keys(data.value.dalek).forEach(function (key) {
          this.contextVars[key] = data.value.dalek[key];
        }.bind(this));

        data.value.test.forEach(function (test) {
          this.reporter.emit('report:assertion', {
            success: test.ok,
            expected: true,
            value: test.ok,
            message: test.message,
            type: 'OK'
          });

          this.incrementExpectations();

          if (!test.ok) {
            this.incrementFailedAssertions();
          }
        }.bind(this));

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
 * Adds a method to the queue of actions/assertions to execute
 *
 * @method _addToActionQueue
 * @param {object} opts Options of the action to invoke
 * @param {string} driverMethod Name of the method to call on the driver
 * @param {function} A callback function that will be executed when the action has been executed
 * @private
 * @chainable
 */

Actions.prototype._addToActionQueue = function (opts, driverMethod, cb) {
  if (driverMethod !== 'screenshot' && driverMethod !== 'imagecut') {
    this.screenshotParams = undefined;
  }

  this.actionPromiseQueue.push(function () {
    var deferred = Q.defer();
    // add a generic identifier as the last argument to any action method call
    opts.push(uuid());
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

Actions.prototype._button = function(button) {
  var buttons = {LEFT: 0, MIDDLE: 1, RIGHT: 2};

  if (button === undefined) {
    button = 0;
  } else if (typeof button !== 'number') {
    button = buttons[button.toUpperCase()] || 0;
  }

  return button;
};

// http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/click
Actions.prototype.buttonClick = function (button) {
  var hash = uuid();
  button = this._button(button);

  var cb = this._generateCallbackAssertion('buttonClick', 'buttonClick');
  this._addToActionQueue([button, hash], 'buttonClick', cb);

  return this;
};

// http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/moveto
Actions.prototype.moveTo = function (selector, x, y) {
  var hash = uuid();

  if (this.querying === true) {
    selector = this.selector;
  }

  if (x === undefined) {
    x = null;
  }

  if (y === undefined) {
    y = null;
  }

  // move to coordinate
  var cb = this._generateCallbackAssertion('moveto', 'moveto');
  this._addToActionQueue([selector, x, y, hash], 'moveto', cb);

  return this;
};

/**
 * Close the active window and automatically selects the parent window.
 *
 * ```javascript
 * this.test.toWindow('test');
 * this.test.close();
 *
 * //you can now write your code as if the original parent window was selected because .close()
 * //selects that automatically for you so you don't have to call .toParentWindow() everytime
 * ```
 *
 * @api
 * @method close
 * @chainable
 */
Actions.prototype.close = function () {
  var hash = uuid();
  var cb = this._generateCallbackAssertion('close', 'close', hash);
  this._addToActionQueue([hash], 'close', cb);

  //since the current window is now closed, make sense to automatically select the parent window since you would have to do this anyway
  this.toParentWindow();

  return this;
};

/**
 * @module DalekJS
 */

module.exports = function (opts) {
  reporter = opts.reporter;
  return Actions;
};
