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
 * Checks & loads reporter modules
 *
 * @module DalekJS
 * @class Reporter
 * @namespace Dalek
 * @part Reporter
 * @api
 */

var Reporter = {

  /**
   * Reporters from the canary channel
   *
   * @param isCanary
   */

  isCanary: {},

  /**
   * Checks if the requested reporter exists
   *
   * @method isReporter
   * @param {string} reporter Name of the reporter
   * @return {bool} isReporter Reporter exists
   */

  isReporter: function (reporter) {
    try {
      require.resolve('dalek-reporter-' + reporter);
    } catch (e) {
      try {
        require.resolve('dalek-reporter-' + reporter + '-canary');
      } catch (e) {
        return false;
      }

      this.isCanary[reporter] = true;
      return true;
    }
    return true;
  },

  /**
   * Loads a requested reporter
   *
   * @method loadReporter
   * @param {string} reporter Name of the reporter
   * @param {object} options Options to pass to the reporter
   * @return {object} reporterInstance Reporter instance
   */

  loadReporter: function (reporter, options) {
    return require('dalek-reporter-' + reporter + (this.isCanary[reporter] ? '-canary' : ''))(options);
  }
};

// export the module
module.exports = Reporter;
