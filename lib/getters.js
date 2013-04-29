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

/**
 * @module
 */

module.exports = function (opts) {
    return new Getters(opts);
};

/**
 * @constructor
 */

function Getters (opts) {};

/**
 * Retrieves current page URL. Note the url will be url-decoded.
 */

Getters.prototype.url = function () {};

/**
 * Retrieves the value of an attribute on the first element matching the provided selector.
 */

Getters.prototype.attr = function (selector, attribute) {};

/**
 * Retrieves a given form and all of its field values.
 */

Getters.prototype.formValues = function (selector, attribute) {};

/**
 * Retrieves a given field value based on a given selector.
 */

Getters.prototype.val = function (selector, attribute) {};

/**
 * Retrieves HTML code from the current page.
 * When no selector is given, it outputs the whole page HTML contents
 */

Getters.prototype.html = function (selector) {};

/**
 * Retrieves TEXT from inside an element.
 * When no selector is given, it outputs the whole page HTML contents
 */

Getters.prototype.text = function (selector) {};

/**
 * Retrieves the current page title.
 */

Getters.prototype.title = function () {};
