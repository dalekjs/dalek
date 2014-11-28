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

// ext. libs
var async = require('async');

// int. libs
var Suite = require('./suite');

/**
 * Configures the driver instance
 *
 * @constructor
 */

var Driver = function (options) {
  // add configuration data to the driver instance
  this.config = options.config;
  this.browser = this.config.get('browser');
  this.files = this.config.get('tests');
  this.drivers = this.config.get('driver');

  // flag if we use the canary driver builds
  this.driverIsCanary = false;

  // link driver events
  this.driverEmitter = options.driverEmitter;
  this.reporterEvents = options.reporterEvents;
};

/**
 * Generates & starts drivers & browsers
 * the tests will be run in
 *
 * @module DalekJS
 * @class Driver
 * @namespace Dalek
 * @part Driver
 * @api
 */

Driver.prototype = {

  /**
   * Checks if the requested driver is available
   *
   * @method isDriver
   * @param {string} driver Name of the requested driver
   * @return {bool} isDriver Driver is availavle
   */

  isDriver: function (driver) {
    try {
      require.resolve('dalek-driver-' + driver);
    } catch (e) {
      try {
        require.resolve('dalek-driver-' + driver + '-canary');
      } catch (e) {
        return false;
      }
      this.driverIsCanary = true;
      return true;
    }
    return true;
  },

  /**
   * Loads the requested driver
   * Emits an event to the reporter
   *
   * @method loadDriver
   * @param {string} driver Name of the requested driver
   * @return {object} driverModule Instance of the driver module
   */

  loadDriver: function (driver) {
    this.reporterEvents.emit('report:log:system', 'dalek-internal-driver: Loading driver: "' + driver + '"');
    return require('dalek-driver-' + driver + (this.driverIsCanary ? '-canary' : ''));
  },

  /**
   * Returns a list with browser driver instances
   *
   * @method getDrivers
   * @return {array} verifiedDrivers
   */

  getDrivers: function () {
    return this.drivers.map(this.getVerifiedBrowser, this)[0];
  },

  /**
   * Returns a list with browser driver instances
   *
   * @method getVerifiedBrowser
   * @param {string} driver Name of the requested driver
   * @return {array} verifiedDrivers Array of dribver 'run' functions
   */

  getVerifiedBrowser: function (driver) {
    return this.browser.map(this.getVerifiedDriver.bind(this, this.loadDriver(driver), driver));
  },

  /**
   * Returns a scoped version of the driver run function
   *
   * @method getVerifiedDriver
   * @param {object} driverModule Instance of the used driver
   * @param {string} driver Name of ther used driver
   * @param {string} browser Name of the used browser
   * @return {function} run Function that kicks off execution of a testsuite chain in a browser
   */

  getVerifiedDriver: function (driverModule, driver, browser) {
    return this.run.bind(this, driver, driverModule, browser);
  },

  /**
   * Loads a browser driver
   *
   * @method loadBrowserConfiguration
   * @param {string} browser Name of the requested browser driver
   * @param {object} browsers Configuration options for the requested browser
   * @return {object} browserConfiguration Browser driver isntance and configuration meta data
   */

  loadBrowserConfiguration: function (browser, browsers, driver) {
    var browserConfiguration;

    if (driver.dummyBrowser && driver.dummyBrowser()) {
      return driver.getBrowser(driver);
    }

    try {
      browserConfiguration = this.getDefaultBrowserConfiguration(browser, browsers);
    } catch (e) {
      browserConfiguration = this.getUserBrowserConfiguration(browser, browsers);
    }

    return browserConfiguration;
  },

  /**
   * Loads the default browser driver
   *
   * @method getDefaultBrowserConfiguration
   * @param {string} browser Name of the requested browser driver
   * @param {object} browsers Configuration options for the requested browser
   * @return {object} browserConfiguration Browser driver isntance and configuration meta data
   */

  getDefaultBrowserConfiguration: function (browser, browsers) {
    var browserConfiguration = {configuration: null, module: null};

    // set browser configuration
    if (browsers[browser]) {
      browserConfiguration.configuration = browsers[browser];
    }

    // try to load `normal` browser modules first,
    // if that doesnt work, try canary builds
    try {
      // check if the browser is a remote instance
      // else, try to load the local browser
      if (browserConfiguration.configuration && browserConfiguration.configuration.type === 'remote') {
        browserConfiguration.module = require('./remote');
      } else {
        browserConfiguration.module = require('dalek-browser-' + browser);
      }
    } catch (e) {
      browserConfiguration.module = require('dalek-browser-' + browser + '-canary');
    }

    return browserConfiguration;
  },

  /**
   * Loads a user configured browser driver
   *
   * @method getUserBrowserConfiguration
   * @param {string} browser Name of the requested browser driver
   * @param {object} browsers Configuration options for the requested browser
   * @return {object} browserConfiguration Browser driver isntance and configuration meta data
   */

  getUserBrowserConfiguration: function (browser, browsers) {
    var browserConfiguration = {configuration: null, module: null};

    if (browsers && browsers[browser] && browsers[browser].actAs) {
      browserConfiguration.module = require('dalek-browser-' + browsers[browser].actAs);
      browserConfiguration.configuration = browsers[browser];
    }

    if (!browserConfiguration.module && browser.search(':') !== -1) {
      var args = browser.split(':');
      var extractedBrowser = args[0].trim();
      var browserType = args[1].trim().toLowerCase();
      browserConfiguration.module = require('dalek-browser-' + extractedBrowser);

      if (browserConfiguration.module && browserConfiguration.module.browserTypes && browserConfiguration.module.browserTypes[browserType]) {
        var binary = (process.platform === 'win32' ? browserConfiguration.module.browserTypes[browserType].win32 : browserConfiguration.module.browserTypes[browserType].darwin);
        browserConfiguration.configuration = {
          binary: binary,
          type: browserType
        };
      }
    }

    return browserConfiguration;
  },

  /**
   * Couple driver & session status events for the reporter
   *
   * @method coupleReporterEvents
   * @param {string} driverName Name of the requested driver
   * @param {string} browser Name of the requested browser
   * @chainable
   */

  coupleReporterEvents: function (driverName, browser) {
    this.driverEmitter.on('driver:sessionStatus:' + driverName + ':' + browser, this.reporterEvents.emit.bind(this.reporterEvents, 'report:driver:session'));
    this.driverEmitter.on('driver:status:' + driverName + ':' + browser, this.reporterEvents.emit.bind(this.reporterEvents, 'report:driver:status'));
    return this;
  },

  /**
   * Returns a list of testsuite runner functions
   *
   * @method getTestsuiteInstances
   * @param {object} driverInstance Instance of the requested driver
   * @return {array} testsuiteRunners List of testsuites that should be run
   */

  getTestsuiteInstances: function (driverInstance) {
    return this.files.map(this.createTestsuiteInstance.bind(this, driverInstance));
  },

  /**
   * Creates a testsuite runner function
   *
   * @method createTestsuiteInstance
   * @param {object} driverInstance Instance of the requested driver
   * @param {string} file Filename of the testsuite
   * @return {function} testsuiteRunner Runner function from the testsuite
   */

  createTestsuiteInstance: function (driverInstance, file) {
    var suite = new Suite({numberOfSuites: this.files.length, file: file, driver: driverInstance, driverEmitter: this.driverEmitter, reporterEmitter: this.reporterEvents});
    return suite.run.bind(suite);
  },

  /**
   * Generates a testsuite instance, emits the
   * browser running event & starts a new async() sesries execution
   * Will be called when the driver is ready
   *
   * @method _onDriverReady
   * @param {string} browser Name of the requested browser
   * @param {string} driverName Name of the requested driver
   * @param {function} callback Asyncs next() callback function
   * @param {object} driverInstance Instance of the requested driver
   * @chainable
   * @private
   */

  _onDriverReady: function (browser, driverName, callback, driverInstance) {
    // generate testsuite instance from test files
    var testsuites = this.getTestsuiteInstances(driverInstance);
    this.reporterEvents.emit('report:run:browser', driverInstance.webdriverClient.opts.longName);
    async.series(testsuites, this._onTestsuiteComplete.bind(this, callback, driverName, browser));
    return this;
  },

  /**
   * Emits a 'tests complete' event & calls async's next() callback
   *
   * @method _onTestsuiteComplete
   * @param {function} callback Async's next() callback function
   * @param {string} driverName Name of the requested driver
   * @param {string} browser Name of the requested browser
   * @chainable
   * @private
   */

  _onTestsuiteComplete: function (callback, driverName, browser) {
    this.driverEmitter.emit('tests:complete:' + driverName + ':' + browser);
    callback();
    return this;
  },

  /**
   * Driver runner function.
   * Registers event handlers for this run,
   * loads browser & driver configuration & instances,
   * emits the 'driver ready' event for the browser/driver combination
   *
   * @method run
   * @param {string} driverName Name of the requested driver
   * @param {object} driverModule Instance of the used driver module
   * @param {string} browser Name of the requested browser
   * @param {function} callback Asyncs next() callback function
   * @chainable
   */

  run: function (driverName, driverModule, browser, callback) {
    // load browser configuration
    var browsersRaw = this.config.get('browsers');
    var browsers = [];

    // Check if we have a valid browser conf, then get the data out
    if (browsersRaw !== null) {
      browsers = browsersRaw[0];
    }

    // init the browser configuration
    var browserConfiguration = this.loadBrowserConfiguration(browser, browsers, driverModule);

    // check if we need to inject the browser alias into the browser module
    if (browserConfiguration.module.setBrowser) {
      browserConfiguration.module.setBrowser(browser);
    }

    // init the driver instance
    var driverInstance = driverModule.create({events: this.driverEmitter, reporter: this.reporterEvents, browser: browser, config: this.config, browserMo: browserConfiguration.module, browserConf: browserConfiguration.configuration});
    // couple driver & session status events for the reporter
    this.coupleReporterEvents(driverName, browser);

    // register shutdown handler
    if (driverInstance.webdriverClient.opts && driverInstance.webdriverClient.opts.kill) {
      this.driverEmitter.on('killAll', driverInstance.webdriverClient.opts.kill.bind(driverInstance.webdriverClient.opts));
    }

    if (driverInstance.webdriverClient.quit) {
      this.driverEmitter.on('killAll', driverInstance.webdriverClient.quit.bind(driverInstance.webdriverClient));
    }

    // dispatch some (web)driver events to the reporter
    this.driverEmitter.on('driver:webdriver:response', function (res) {
      this.reporterEvents.emit('report:log:system:webdriver', 'webdriver: ' + res.statusCode + ' ' + res.method + ' ' + res.path);
      this.reporterEvents.emit('report:log:system:webdriver', 'webdriver: ' + res.data);
    }.bind(this));

    // run the tests in the browser, when the driver is ready
    // emit the tests:complete event, when all tests have been run
    this.driverEmitter.on('driver:ready:' + driverName + ':' + browser, this._onDriverReady.bind(this, browser, driverName, callback, driverInstance));
    return this;
  }
};

// export driver module
module.exports = Driver;
