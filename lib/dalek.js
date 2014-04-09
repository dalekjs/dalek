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
var EventEmitter2 = require('eventemitter2').EventEmitter2;

// int. libs
var Driver = require('./dalek/driver');
var Reporter = require('./dalek/reporter');
var Timer = require('./dalek/timer');
var Config = require('./dalek/config');
var Host = require('./dalek/host');

/**
 * Default options
 * @type {Object}
 */

var defaults = {
  reporter: ['console'],
  driver: ['native'],
  browser: ['phantomjs'],
  viewport: {width: 1280, height: 1024},
  logLevel: 3
};

/**
 * Setup all the options needed to configure dalek
 *
 * @param {options} opts Configuration options
 * @constructor
 */

var Dalek = function (opts) {
  // setup instance
  this._initialize();

  // register exception handler
  this._registerExceptionHandler();

  // normalize options
  this.options = this.normalizeOptions(opts);

  // getting advanced options
  if (opts && opts.advanced) {
    this.advancedOptions = opts.advanced;
  }

  // initiate config
  this.config = new Config(defaults, this.options, this.advancedOptions);

  // override tests if provided on the commandline
  if (this.options.tests) {
    this.config.config.tests = this.options.tests;
  }

  // prepare and load reporter(s)
  this._setupReporters();

  // count all passed & failed assertions
  this.reporterEvents.on('report:assertion', this._onReportAssertion.bind(this));

  // init the timer instance
  this.timer = new Timer();

  // prepare driver event emitter instance
  this._setupDriverEmitter();

  // check for file option, throw error if none is given
  // only bypasses if dalek runs in the remote mode
  if (!Array.isArray(this.config.get('tests')) && !this.options.remote) {
    this.reporterEvents.emit('error', 'No test files given!');
    this.driverEmitter.emit('killAll');
    process.exit(127);
  }

  // init the driver instance
  this._initDriver();

  // check if dalek runs as a remote browser launcher
  if (this.options.remote) {
    var host = new Host({reporterEvents: this.reporterEvents, config: this.config});
    host.run({
      port: !isNaN(parseFloat(this.options.remote)) && isFinite(this.options.remote) ? this.options.remote : false
    });
  }
};

/**
 * Daleks base module
 * Used to configure all the things
 * and to start off the tests
 *
 * @module DalekJS
 * @class Dalek
 */

Dalek.prototype = {

  /**
   * Runs the configured testsuites
   *
   * @method run
   * @chainable
   */

  run: function () {
    // early return; in case of remote
    if (this.options.remote) {
      return this;
    }

    // start the timer to measure the execution time
    this.timer.start();

    // emit the runner started event
    this.reporterEvents.emit('report:runner:started');

    // execute all given drivers sequentially
    var drivers = this.driver.getDrivers();
    async.series(drivers, this.testsuitesFinished.bind(this));
    return this;
  },

  /**
   * Reports the all testsuites executed event
   *
   * @method testsuitesFinished
   * @chainable
   */

  testsuitesFinished: function () {
    this.driverEmitter.emit('tests:complete');
    setTimeout(this.reportRunFinished.bind(this), 0);
    return this;
  },

  /**
   * Reports the all testsuites executed event
   *
   * @method reportRunFinished
   * @chainable
   */

  reportRunFinished: function () {
    this.reporterEvents.emit('report:runner:finished', {
      elapsedTime: this.timer.stop().getElapsedTimeFormatted(),
      assertions: this.assertionsFailed + this.assertionsPassed,
      assertionsFailed: this.assertionsFailed,
      assertionsPassed: this.assertionsPassed,
      status: this.runnerStatus
    });

    //we want to exit process with code 1 to single that test did not pass
    if(this.runnerStatus !== true) {
      var processExitCaptured = false;

      process.on('exit', function() {
        if(processExitCaptured === false) {
          processExitCaptured = true;
          process.exit(1);
        }
      });
    }

    return this;
  },

  /**
   * Normalizes options
   *
   * @method normalizeOptions
   * @param {object} options Raw options
   * @return {object} Normalized options
   */

  normalizeOptions: function (options) {
    Object.keys(options).forEach(function (key) {
      if ({reporter: 1, driver: 1}[key]) {
        options[key] = options[key].map(function (input) { return input.trim(); });
      }
    });

    return options;
  },

  /**
   * Sets up system env properties
   *
   * @method _initialize
   * @chainable
   * @private
   */

  _initialize: function () {
    // prepare error data
    this.warnings = [];
    this.errors = [];

    // prepare state data for the complete test run
    this.runnerStatus = true;
    this.assertionsFailed = 0;
    this.assertionsPassed = 0;

    return this;
  },

  /**
   * Sets up all the reporters
   *
   * @method _setupReporters
   * @chainable
   * @private
   */

  _setupReporters: function () {
    this.reporters = [];
    this.reporterEvents = new EventEmitter2();
    this.reporterEvents.setMaxListeners(Infinity);
    this.options.reporter = this.config.verifyReporters(this.config.get('reporter'), Reporter);
    this.options.reporter.forEach(this._addReporter, this);
    return this;
  },

  /**
   * Adds a reporter
   *
   * @method _addReporter
   * @param {string} reporter Name of the reporter to add
   * @chainable
   * @private
   */

  _addReporter: function (reporter) {
    this.reporters.push(Reporter.loadReporter(reporter, {events: this.reporterEvents, config: this.config, logLevel: this.config.get('logLevel')}));
    return this;
  },

  /**
   * Updates the assertion state
   *
   * @method _onReportAssertion
   * @param {object} assertion Informations aout the runned assertions
   * @chainable
   * @private
   */

  _onReportAssertion: function (assertion) {
    if (assertion.success) {
      this.assertionsPassed++;
    } else {
      this.runnerStatus = false;
      this.assertionsFailed++;
    }
    return this;
  },

  /**
   * Initizializes the driver instances
   *
   * @method _initDriver
   * @chainable
   * @private
   */

  _initDriver: function () {
    this.driver = new Driver({
      config: this.config,
      driverEmitter: this.driverEmitter,
      reporterEvents: this.reporterEvents
    });

    this.options.driver = this.config.verifyDrivers(this.config.get('driver'), this.driver);
    return this;
  },

  /**
   * Sets up the event dispatcher for driver events
   *
   * @method _setupDriverEmitter
   * @chainable
   * @private
   */

  _setupDriverEmitter: function () {
    var driverEmitter = new EventEmitter2();
    driverEmitter.setMaxListeners(Infinity);
    this.driverEmitter = driverEmitter;
    return this;
  },

  /**
   * Make sure to shutdown dalek & its spawned
   * components, webservers gracefully if a
   * runtime error pops up
   *
   * @method _registerExceptionHandler
   * @private
   * @chainable
   */

  _registerExceptionHandler: function () {
    process.setMaxListeners(Infinity);
    process.on('uncaughtException', this._shutdown.bind(this));
    return this;
  },

  /**
   * Shutdown on uncaught exception
   *
   * @method _shutdown
   * @param {object} exception Runtime exception
   * @private
   */

  _shutdown: function (exception) {
    // ios emulator hack, needs to go in the future
    if (exception.message && exception.message.search('This socket has been ended by the other party') !== -1) {
      return false;
    }

    this.driverEmitter.emit('killAll');
    this.reporterEvents.emit('error', exception);
  }

};

// export dalek as a module
module.exports = Dalek;
