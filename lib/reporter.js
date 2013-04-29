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

var fs = require('fs');

/**
 * @module
 */

module.exports = function (opts) {
    return new Reporter(opts);
};

/**
 * @constructor
 */

function Reporter (opts) {};

/**
 *
 */

Reporter.prototype.isReporter = function (reporter) {
  try {
    return fs.existsSync(process.cwd() + '/node_modules/dalek-reporter-' + reporter);
    //require.resolve('dalek-reporter-' + reporter);
  } catch (e) {
    return false
  }
  return true;
};

/**
 *
 */

Reporter.prototype.loadReporter = function (reporter, opts) {
  return require(process.cwd() + '/node_modules/' + 'dalek-reporter-' + reporter + '/index')(opts);
};
