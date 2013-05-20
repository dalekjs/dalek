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

var async = require('async');
var testsuite = require('./testsuite');
var fs = require('fs');

/**
 * @module
 */

module.exports = function (opts) {
    return new Driver(opts);
};

/**
 * @constructor
 */

function Driver (opts) {};

/**
 *
 */

Driver.prototype.isDriver = function (driver) {
  try {
    return fs.existsSync(process.cwd() + '/node_modules/dalek-driver-' + driver);
    //require.resolve('dalek-driver-' + driver);
  } catch (e) {
    return false
  }
  return true;
};

/**
 *
 */

Driver.prototype.loadDriver = function (driver) {
  return require(process.cwd() + '/node_modules/' + 'dalek-driver-' + driver + '/index');
};

/**
 *
 */

Driver.prototype.getDrivers = function () {
  var drivers = [];
  this.drivers.forEach(function (driver) {
    var driverModule = this.loadDriver(driver);
    if (driverModule.isMultiBrowser()) {
      this.browser.forEach(function (browser) {
        drivers.push(this.run.bind(this, driver, driverModule, browser));
      }.bind(this));
    } else {
      drivers.push(this.run.bind(this, driver, driverModule, driverModule.getBrowser()[0]));
    }

  }.bind(this));
  return drivers;
};

/**
 *
 */

Driver.prototype.run = function (driverName, driverModule, browser, callback) {
  var testsuites = [];
  // generate testsuite instance from test files
  var driverInstance = driverModule.create({events: this.driverEmitter, browser: browser});
  this.files.forEach(function (file) {
    var suite = testsuite({file: file, driver: driverInstance, driverEmitter: this.driverEmitter, reporterEmitter: this.reporterEvents});
    testsuites.push(suite.run.bind(suite));
  }.bind(this));

  this.driverEmitter.on('driver:ready:' + driverName + ':' + browser, function () {
    this.reporterEvents.emit('report:run:browser', browser.charAt(0).toUpperCase() + browser.slice(1));
    async.series(testsuites, function (cb) {
        this.driverEmitter.emit('tests:complete:' + driverName + ':' + browser);
        callback();
    }.bind(this));
  }.bind(this));

  return this;
};
