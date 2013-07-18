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
var chai = require('chai');

// Module variable
var Assertions;

/**
 * @module Assertions
 * @class Assertions
 * @namespace Dalek.Internal
 */

module.exports = function () {
  return Assertions;
};

/**
 * @constructor
 * @part Assertions
 * @api
 */

Assertions = function (opts) {
  this.test = opts.test;
  this.proceeded = [];
  this.chaining = false;
};

/**
 * Starts assertion chaining
 *
 * @method chain
 * @api
 */

Assertions.prototype.chain = function () {
  this.test.lastChain.push('chaining');
  this.chaining = true;
  return this;
};

/**
 * Ends an assertion chain
 *
 * @method end
 * @api
 */

Assertions.prototype.end = function () {
  var lastAction = this.test.lastChain.pop();
  if (lastAction === 'chaining') {
    this.chaining = false;
  }

  if (lastAction  === 'querying') {
    this.test.querying = false;
  }
  return this.test;
};

/**
 * Asserts that a given ressource does exist in the environment.
 *
 * @method resourceExists
 * @api
 */

Assertions.prototype.resourceExists = function (url, message) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('resourceExists', 'resourceExists', this._testTruthy, hash, {url: url, message: message}).bind(this.test);
  this._addToActionQueue([url, hash], 'resourceExists', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that a given element appears n times on the page.
 *
 *
 * Given this portion of html, you would like to assure that all of these elements
 * are ending up in your rendered markup on your page.
 *
 * ```html
 * <section id="blog-overview">
 *   <article class="teaser"></article>
 *   <article class="teaser"></article>
 *   <article class="teaser"></article>
 *   <article class="teaser"></article>
 * </section>
 * ```
 *
 * The simple solution is to check if all these elements are present
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser', 4, '4 blog teasers are present')
 * ```
 * The alternate syntax for this is:
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .is(4, '4 blog teasers are present')
 * ```
 *
 * If you are not sure how many elements will exactly end up in your markup,
 * you could use the between assertion handler
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .is.between(2, 6, 'Between 2 and 6 blog teasers are present')
 * ```
 *
 * If you dealing with the situation that you have a minimum of elements,
 * you expect, you can use this helper...
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .is.gt(2, 'At least 3 blog teasers are present')
 * ```
 * ... if you want to know if its 'greater than equal', you can use this one...
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .is.gte(2, 'At least 2 blog teasers are present')
 * ```
 * ... as well as their 'lower than' and 'lower than equal' equivalents
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .is.lt(5, 'Less than 5 blog teasers are present')
 * ```
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .is.lte(5, 'Less than, or 5 blog teasers are present')
 * ```
 * And if you just wan't to know, if a certain amount of teasers isn't present,
 * you can still use the ':not(): assertion helper
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .is.not(5, 'There are more or less than 5 teasers present')
 * ```
 *
 * If you wan't to allow multiple correct values, you can use the ':are()' helper
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .are([1,3,6], 'Teaser count is an odd number between 1 and 6')
 * ```
 *
 * of couse you can test for the opoosite with ':are()'
 *
 * ```javascript
 * test.numberOfElements('#blog-overview .teaser')
 *     .are([0,2,4], 'Teaser count is not an even number between 1 and 6')
 * ```
 *
 * @api
 * @method numberOfElements
 */

Assertions.prototype.numberOfElements = function (selector, expected, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = expected;
    expected = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('numberOfElements', 'numberOfElements', this._testShallowEquals, hash, {expected: expected, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'getNumberOfElements', cb);
  return this.chaining ? this : this.test;
};

/**
 *
 * Asserts that a given element is visible n times in the current viewport.
 *
 *
 * Given this portion of html, you would like to assure that all of these elements
 * are ending up in your rendered markup on your page.
 *
 * ```html
 * <section id="blog-overview">
 *   <article class="teaser"></article>
 *   <article class="teaser"></article>
 *   <article class="teaser"></article>
 *   <article class="teaser"></article>
 * </section>
 * ```
 *
 * The simple solution is to check if all these elements are visible
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser', 4, '4 blog teasers are visible')
 * ```
 * The alternate syntax for this is:
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .is(4, '4 blog teasers are visible')
 * ```
 *
 * If you are not sure how many elements will exactly be shown in the current viewport,
 * you could use the between assertion handler
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .is.between(2, 6, 'Between 2 and 6 blog teasers are visible')
 * ```
 *
 * If you dealing with the situation that you have a minimum of elements,
 * you expect, you can use this helper...
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .is.gt(2, 'At least 3 blog teasers are visible')
 * ```
 * ... if you want to know if its 'greater than equal', you can use this one...
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .is.gte(2, 'At least 2 blog teasers are visible')
 * ```
 * ... as well as their 'lower than' and 'lower than equal' equivalents
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .is.lt(5, 'Less than 5 blog teasers are visible')
 * ```
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .is.lte(5, 'Less than, or 5 blog teasers are visible')
 * ```
 * And if you just wan't to know, if a certain amount of teasers isn't visible,
 * you can still use the ':not(): assertion helper
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .is.not(5, 'There are more or less than 5 teasers visible')
 * ```
 *
 * If you wan't to allow multiple correct values, you can use the ':are()' helper
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .are([1,3,6], 'Teaser count is an odd number between 1 and 6')
 * ```
 *
 * of couse you can test for the opoosite with ':are()' and ':not()'
 *
 * ```javascript
 * test.numberOfVisibleElements('#blog-overview .teaser')
 *     .are.not([0,2,4], 'Teaser count is not an even number between 1 and 6')
 * ```
 *
 * @api
 * @method numberOfVisibleElements
 */

Assertions.prototype.numberOfVisibleElements = function (selector, expected, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = expected;
    expected = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('numberOfVisibleElements', 'numberOfVisibleElements', this._testShallowEquals, hash, {expected: expected, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'getNumberOfVisibleElements', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that a given form field has the provided value.
 *
 * Given this portion of html, we would like to get the information which option element
 * is currently selected.
 *
 * ```html
 * <form name="fav-doctor" id="fav-doctor">
 *   <select id="the-doctors">
 *     <option value="9">Eccleston</option>
 *     <option selected value="10">Tennant</option>
 *     <option value="11">Smith</option>
 *   </select>
 * </form>
 * ```
 *
 * ```javascript
 * test
 *   .val('#the-doctors', 10, 'David is the favourite')
 *   // lets change the favourite by selection the last option
 *  .click('#the-doctors option:last')
 *  .val('#the-doctors', 11, 'Matt is now my favourite, bow ties are cool')
 * ```
 *
 * This assertion is capable of getting the values from every form element
 * that holds a value attribute
 *
 * Getting texts out of normal input fields is pretty straight forward
 *
 * ```html
 * <label for="fav-enemy">Tell my your favourity Who enemy:</label>
 * <input id="fav-enemy" name="fav-enemy" type="text" value="Daleks" />
 * ```
 *
 * ```javascript
 * test
 *   .val('#fav-enemy', 'Daleks', 'Daleks are so cute')
 *   // lets change the favourite by typing smth. new
 *  .type('#fav-enemy', 'Cyberman')
 *  .val('#fav-enemy', 'Cyberman', 'Cyberman are so cyber')
 * ```
 *
 * Of course, you can use a bunch of assertion helpers, to enable
 * yourself to do more than just one assertion with the ':are()' helper.
 *
 * ```javascript
 * test
 *   .val('#fav-enemy')
 *   .is('Daleks', 'Still cute, those daleks')
 *   .is.not('Klingons', 'Different fandom bro')
 *   // yep, multiple mentions are allowed
 *   .are(['Daleks', 'Cyberman', 'The master'], 'All of them are cool');
 * ```
 *
 * @method val
 * @api
 */


Assertions.prototype.val = function (selector, expected, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = expected;
    expected = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('val', 'val', this._testShallowEquals, hash, {expected: expected, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'getValue', cb);
  return this.chaining ? this : this.test;
};

Assertions.prototype.css = function (selector, property, expected, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = expected;
    expected = property;
    property = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('css', 'css', this._testShallowEquals, hash, {expected: expected, selector: selector, porperty: property, message: message}).bind(this.test);
  this._addToActionQueue([selector, property, expected, hash], 'css', cb);
  return this.chaining ? this : this.test;
};

Assertions.prototype.width = function (selector, expected, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = expected;
    expected = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('width', 'width', this._testShallowEquals, hash, {expected: expected, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'width', cb);
  return this.chaining ? this : this.test;
};

Assertions.prototype.height = function (selector, expected, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = expected;
    expected = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('height', 'height', this._testShallowEquals, hash, {expected: expected, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'height', cb);
  return this.chaining ? this : this.test;
};

Assertions.prototype.selected = function (selector, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('selected', 'selected', this._testShallowEquals, hash, {expected: true, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, true, hash], 'selected', cb);
  return this.chaining ? this : this.test;
};

Assertions.prototype.notSelected = function (selector, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('selected', 'selected', this._testShallowEquals, hash, {expected: false, selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, false, hash], 'selected', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that current HTTP status code is the same as the one passed as argument.
 * TODO: Needs some work
 */

Assertions.prototype.httpStatus = function (status, message) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('httpStatus', 'httpStatus', this._testShallowEquals, hash, {expected: status, message: message}).bind(this.test);
  this._addToActionQueue([status, hash], 'httpStatus', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that an element matching the provided selector expression exists in remote DOM environment.
 *
 * ```html
 * <body>
 *   <p id="so-lonely">Last of the timelords</p>
 * </body>
 * ```
 *
 * ```javascript
 * test
 *   .exists('#so-lonely', 'The loneliest element in the universe exists')
 * ```
 *
 * @method exists
 * @api
 */

Assertions.prototype.exists = function (selector, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('exists', 'exists', this._testTruthy, hash, {selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, hash], 'exists', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that an element matching the provided selector expression doesn't exists within the remote DOM environment.
 *
 * ```html
 * <body>
 *   <p id="so-lonely">Last of the timelords</p>
 * </body>
 * ```
 *
 * ```javascript
 * test
 *   .doesntExist('#the-master', 'The master element has not been seen')
 * ```
 *
 * @method doesntExist
 * @api
 */

Assertions.prototype.doesntExist = function (selector, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('exists', '!exists', this._testFalsy, hash, {selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, hash], 'exists', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that the element matching the provided selector expression is not visible.
 */

Assertions.prototype.notVisible = function (selector, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('visible', '!visible', this._testFalsy, hash, {selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, hash], 'visible', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that the element matching the provided selector expression is visible.
 */

Assertions.prototype.visible = function (selector, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('visible', 'visible', this._testTruthy, hash, {selector: selector, message: message}).bind(this.test);
  this._addToActionQueue([selector, hash], 'visible', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that given text does not exist in the provided selector.
 */

Assertions.prototype.doesntHaveText = function (selector, expected, message) {
  var hash = uuid.v4();
  if (this.test.querying === true) {
    message = expected;
    expected = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('text', '!text', this._testShallowUnequals, hash, {selector: selector, expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'text', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that given text does exist in the provided selector.
 */

Assertions.prototype.text = function (selector, expected, message) {
  var hash = uuid.v4();
  if (this.test.querying === true) {
    message = expected;
    expected = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('text', 'text', this._testShallowEquals, hash, {selector: selector, expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([selector, expected, hash], 'text', cb);
  return (this.chaining || this.test.querying) ? this : this.test;
};

/**
 * Asserts that given text does exist in the provided selector.
 *
 * @param {String} expected
 * @param {String} message
 * @return {Object}
 */

Assertions.prototype.title = function (expected, message) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('title', 'title', this._testShallowEquals, hash, {expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([expected, hash], 'title', cb);
  return this.chaining ? this : this.test;
};

/**
 * Asserts that given title does not mathc the given expactions
 *
 * @param {String} expected
 * @param {String} message
 * @return {Object}
 */

Assertions.prototype.doesntHaveTitle = function (expected, message) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('title', '!title', this._testShallowUnequals, hash, {expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([expected, hash], 'title', cb);
  return this.chaining ? this : this.test;
};


/**
 *
 */

Assertions.prototype.url = function (expected, message) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('url', 'url', this._testShallowEquals, hash, {expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([expected, hash], 'url', cb);
  return this.chaining ? this : this.test;
};

/**
 *
 */

Assertions.prototype.doesntHaveUrl = function (expected, message) {
  var hash = uuid.v4();
  var cb = this._generateCallbackAssertion('url', '!url', this._testShallowUnequals, hash, {expected: expected, message: message}).bind(this.test);
  this._addToActionQueue([expected, hash], 'url', cb);
  return this.chaining ? this : this.test;
};

/**
 *
 */

Assertions.prototype.attr = function (selector, attribute, expected, message) {
  var hash = uuid.v4();

  if (this.test.querying === true) {
    message = expected;
    expected = attribute;
    attribute = selector;
    selector = this.test.selector;
  }

  var cb = this._generateCallbackAssertion('attribute', 'attribute', this._testShallowEquals, hash, {expected: expected, message: message, selector: selector, attribute: attribute}).bind(this.test);
  this._addToActionQueue([selector, attribute, expected, hash], 'attribute', cb);
  return this.chaining ? this : this.test;
};

// TEST HELPER
// -----------

/**
 *
 */

Assertions.prototype.is = function (expected, message) {
  return this.generateTestHelper('is', '_testShallowEquals', false)(expected, message);
};


/**
 *
 */

Assertions.prototype.not = function (expected, message) {
  return this.generateTestHelper('not', '_testShallowEquals', true)(expected, message);
};

/**
 *
 */

Assertions.prototype.between = function (expected, message) {
  return this.generateTestHelper('between', '_testBetween', false)(expected, message);
};

/**
 *
 */

Assertions.prototype.gt = function (expected, message) {
  return this.generateTestHelper('gt', '_testGreaterThan', false)(expected, message);
};

/**
 *
 */

Assertions.prototype.gte = function (expected, message) {
  return this.generateTestHelper('gte', '_testGreaterThanEqual', false)(expected, message);
};

/**
 *
 */

Assertions.prototype.lt = function (expected, message) {
  return this.generateTestHelper('lt', '_testLowerThan', false)(expected, message);
};

/**
 *
 */

Assertions.prototype.lte = function (expected, message) {
  return this.generateTestHelper('lte', '_testLowerThanEqual', false)(expected, message);
};

// HELPER METHODS
// --------------

/**
 *
 */

Assertions.prototype._generateCallbackAssertion = function (key, type, test, hash, opts) {
  var cb = function (data) {
    if (data && data.key === key && data.hash === hash) {

      this._lastGeneratedAction = {key: key, type: type, test: test, hash: hash, opts: opts, data: data};

      if (!opts.expected && (key === 'title' || key === 'url' || key === 'text' || key === 'attribute' || key === 'numberOfElements' || key === 'numberOfVisibleElements')) {
        return false;
      }

      var testResult = test(data.value, opts.expected);

      this.reporter.emit('report:assertion', {
        success: testResult,
        expected: opts.expected,
        value: data.value,
        message: opts.message,
        type: type
      });

      this.incrementExpectations();
      if (!testResult) {
        this.incrementFailedAssertions();
      }
    }
  };
  return cb;
};

/**
 *
 */

Assertions.prototype._addToActionQueue = function (opts, driverMethod, cb) {
  this._lastGeneratedShit = {opts: opts, driverMethod: driverMethod};
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

Assertions.prototype.generateTestHelper = function (name, assertionFn, negate) {
  return function (expected, message) {
    var gen = this._lastGeneratedShit;

    this.test.actionPromiseQueue.push(function () {
      var deferredAction = Q.defer();
      deferredAction.resolve();
      this.test.driver.events.on('driver:message', function () {

        if (gen.opts && gen.opts[(gen.opts.length - 1)] && this.test._lastGeneratedAction && this.test._lastGeneratedAction.hash) {
          if (gen.opts[(gen.opts.length - 1)] === this.test._lastGeneratedAction.hash && !this.proceeded[this.test._lastGeneratedAction.hash + name]) {
            var testResult = this[assertionFn](expected, this.test._lastGeneratedAction.data.value);

            if (negate) {
              testResult = !testResult;
            }

            this.proceeded[this.test._lastGeneratedAction.hash + name] = true;

            this.test.reporter.emit('report:assertion', {
              success: testResult,
              expected: expected,
              value: this.test._lastGeneratedAction.data.value,
              message: message,
              type: this.test._lastGeneratedAction.type
            });

            this.test.incrementExpectations();

            if (!testResult) {
              this.test.incrementFailedAssertions();
            }
          }
        }
      }.bind(this));
      return deferredAction.promise;
    }.bind(this));

    return this.chaining ? this : this.test;
  }.bind(this);
};

// ASSERT METHODS
// --------------

/**
 * Assert if a given value shallow equals a snd. given value
 *
 * @method _testShallowEquals
 * @param {mixed} a Value to test
 * @param {mixed} b Value to test
 * @return {bool} false if values don't match, true if they match
 * @private
 */

Assertions.prototype._testShallowEquals = function (a, b) {
  try {
    chai.assert.equal(a, b);
  } catch (e) {
    return false;
  }

  return true;
};

/**
 * Assert if a given value shallow does not equal a snd. given value
 *
 * @method _testShallowUnequals
 * @param {mixed} a Value to test
 * @param {mixed} b Value to test
 * @return {bool} true if values don't match, false if they match
 * @private
 */

Assertions.prototype._testShallowUnequals = function (a, b) {
  try {
    chai.assert.notEqual(a, b);
  } catch (e) {
    return false;
  }

  return true;
};


Assertions.prototype._testBetween = function (a, b) {
  try {
    chai.expect(b).to.be.within(a[0], a[1]);
  } catch (e) {
    return false;
  }

  return true;
};

Assertions.prototype._testGreaterThan = function (a, b) {
  try {
    chai.expect(b).to.be.above(a);
  } catch (e) {
    return false;
  }

  return true;
};

Assertions.prototype._testGreaterThanEqual = function (a, b) {
  return this._testGreaterThan(a - 1, b);
};

Assertions.prototype._testLowerThan = function (a, b) {
  try {
    chai.expect(b).to.be.below(a);
  } catch (e) {
    return false;
  }

  return true;
};

Assertions.prototype._testLowerThanEqual = function (a, b) {
  return this._testLowerThan(a + 1, b);
};

/**
 * Assert if a given value is boolean 'true'
 *
 * @method _testTruthy
 * @param {bool} a Value to test
 * @return {bool} false if value is false, true if value is true
 * @private
 */

Assertions.prototype._testTruthy = function (a) {
  return a === 'true' || a === true;
};

/**
 * Assert if a given value is boolean 'false'
 *
 * @method _testFalsy
 * @param {bool} a Value to test
 * @return {bool} true if value is false, false if value is true
 * @private
 */

Assertions.prototype._testFalsy = function (a) {
  return a === 'false' || a === false;
};
