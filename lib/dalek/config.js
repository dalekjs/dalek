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
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var yaml = require('js-yaml');
var JSON5 = require('json5');
var glob = require('glob');
require('coffee-script/register');

/**
 * Configures the config instance
 *
 * @param {object} defaults Default parameter options
 * @param {object} opts Command line options
 * @constructor
 */

var Config = function (defaults, opts, advOpts) {
  this.customFilename = null;
  this.defaultFilename = 'Dalekfile';
  this.supportedExtensions = ['yml', 'json5', 'json', 'js', 'coffee'];
  this.advancedOptions = advOpts;
  this.config = this.load(defaults, opts.config, opts);
};

/**
 * Parses config data & loads config files for [DalekJS](//github.com/dalekjs/dalek) tests.
 *
 * This module is a driver plugin for [DalekJS](//github.com/dalekjs/dalek).
 * It connects Daleks testsuite with the remote testing environment of [Sauce Labs](https://saucelabs.com).
 *
 * The driver can be installed with the following command:
 *
 * ```bash
 * $ npm install dalek-driver-sauce --save-dev
 * ```
 *
 * You can use the driver by adding a config option to the your [Dalekfile](/docs/config.html)
 *
 * ```javascript
 * "driver": ["sauce"]
 * ```
 *
 * Or you can tell Dalek that it should run your tests via sauces service via the command line:
 *
 * ```bash
 * $ dalek mytest.js -d sauce
 * ```
 *
 * In order to run your tests within the Sauce Labs infrastructure, you must add your sauce username & key
 * to your dalek configuration. Those two parameters must be set in order to get this driver up & running.
 * You can specifiy them within your [Dalekfile](/docs/config.html) like so:
 *
 * ```javascript
 * "driver.sauce": {
 *   "user": "dalekjs",
 *   "key": "aaaaaa-1234-567a-1abc-1br6d9f68689"
 * }
 * ```
 *
 * It is also possible to specify a set of other extra saucy parameters like `name` & `tags`:
 *
 * ```javascript
 * "driver.sauce": {
 *   "user": "dalekjs",
 *   "key": "aaaaaa-1234-567a-1abc-1br6d9f68689",
 *   "name": "Guineapig",
 *   "tags": ["dalek", "testproject"]
 * }
 * ```
 *
 * If you would like to have a more control over the browser/OS combinations that are available, you are able
 * to configure you custom combinations:
 *
 * ```javascript
 * "browsers": [{
 *   "chrome": {
 *     "platform": "OS X 10.6",
 *     "actAs": "chrome",
 *     "version": 27
 *   },
 *   "chromeWin": {
 *     "platform": "Windows 7",
 *     "actAs": "chrome",
 *     "version": 27
 *   },
 *   "chromeLinux": {
 *     "platform": "Linux",
 *     "actAs": "chrome",
 *     "version": 26
 *   }
 * ```
 *
 * You can then call your custom browsers like so:
 *
 * ```bash
 * $ dalek mytest.js -d sauce -b chrome,chromeWin,chromeLinux
 * ```
 *
 * or you can define them in your Dalekfile:
 *
 * ```javascript
 * "browser": ["chrome", "chromeWin", "chromeLinux"]
 * ```
 *
 * A list of all available browser/OS combinations, can be found [here](https://saucelabs.com/docs/platforms).
 *
 * @module DalekJS
 * @class Config
 * @namespace Dalek
 * @part Config
 * @api
 */

Config.prototype = {

  /**
   * Checks if a config file is available
   *
   * @method checkAvailabilityOfConfigFile
   * @param {String} pathname
   * @return {String} config File path
   */

  checkAvailabilityOfConfigFile: function (pathname) {
    // check if a pathname is given,
    // then check if the file is available
    if (pathname && fs.existsSync(pathname)) {
      return fs.realpathSync(pathname);
    }

    // check if any of the default configuration files is available
    return this.supportedExtensions.reduce(this._checkFile.bind(this));
  },

  /**
   * Iterator function that checks the existance of a given file
   *
   * @method _checkFile
   * @param {String} previousValue Last iterations result
   * @param {String} ext File extension to check
   * @param {integer} idx Iteration index
   * @param {object} data File data
   * @return {String} config File path
   * @private
   */

  _checkFile: function (previousValue, ext, idx, data) {
    if (previousValue.length > 6) {
      return previousValue;
    }

    var fileToCheck = this.defaultFilename + '.' + previousValue;
    if (fs.existsSync(fileToCheck)) {
      return fs.realpathSync(fileToCheck);
    }

    return this._checkDefaultFile(ext, data);
  },

  /**
   * Iterator function that checks the existance of a the default file
   *
   * @method _checkDefaultFile
   * @param {String} ext File extension to check
   * @param {object} data File data
   * @return {String} config File path
   * @private
   */

  _checkDefaultFile: function (ext, data) {
    if (ext === data[data.length - 1]) {
      var fileToCheck = this.defaultFilename + '.' + ext;
      if (fs.existsSync(fileToCheck)) {
        return fs.realpathSync(fileToCheck);
      }
    }

    return ext;
  },

  /**
   * Loads a file & merges the results with the
   * commandline options & the default config
   *
   * @method load
   * @param {object} defaults Default config
   * @param {String} pathname Filename of the config file to load
   * @param {object} opts Command line options
   * @return {object} config Merged config data
   */

  load: function (defaults, pathname, opts) {
    var file = this.checkAvailabilityOfConfigFile(pathname);
    var data = {};

    if (!this.advancedOptions || this.advancedOptions.dalekfile !== false) {
      data = this.loadFile(file);
    }

    // remove the tests property if the array length is 0
    if (opts.tests.length === 0) {
      delete opts.tests;
    }

    if (data.tests && _.isArray(data.tests) && data.tests.length > 0) {
      var tests = [];

      //get all the files that match
      _.forEach(data.tests, function(search) {
        tests = tests.concat(glob.sync(search));
      });

      //remove duplicate files
      tests = tests.filter(function(elem, pos, self) {
        return self.indexOf(elem) === pos;
      });

      data.tests = tests;
    }

    return _.merge(defaults, data, opts, (this.advancedOptions || {}));
  },

  /**
   * Loads a config file & parses it based on the file extension
   *
   * @method loadFile
   * @param {String} pathname Filename of the config file to load
   * @return {object} data Config data
   */

  loadFile: function (pathname) {
    var ext = path.extname(pathname).replace('.', '');
    return this['read' + ext] ? this['read' + ext](pathname) : {};
  },

  /**
   * Fetches & returns a config item
   *
   * @method get
   * @param {String} item Key of the item to load
   * @return {mixed|null} data Requested config data
   */

  get: function (item) {
    return this.config[item] || null;
  },

  /**
   * Loads a json config file
   *
   * @method readjson
   * @return {object} data Parsed config data
   */

  readjson: function (pathname) {
    var contents = fs.readFileSync((pathname || this.defaultFilename + '.json'), 'utf8');
    return JSON.parse(contents);
  },

  /**
   * Loads a json5 config file
   *
   * @method readJson5
   * @return {object} data Parsed config data
   */

  readjson5: function (pathname) {
    var contents = fs.readFileSync((pathname || this.defaultFilename + '.json5'), 'utf8');
    return JSON5.parse(contents);
  },

  /**
   * Loads a yaml config file
   *
   * @method readyaml
   * @return {object} data Parsed config data
   */

  readyml: function (pathname) {
    var contents = fs.readFileSync((pathname || this.defaultFilename + '.yml'), 'utf8');
    return yaml.load(contents);
  },

  /**
   * Loads a javascript config file
   *
   * @method readjs
   * @return {object} data Parsed config data
   */

  readjs: function (pathname) {
    return require((pathname || this.defaultFilename));
  },

  /**
   * Loads a coffescript config file
   *
   * @method readcoffee
   * @return {object} data Parsed config data
   */

  readcoffee: function (pathname) {
    return require((pathname || this.defaultFilename));
  },

  /**
   * Verifies if a reporter is given, exists & is valid
   *
   * @method verifyReporters
   * @return {array} data List of verified reporters
   */

  verifyReporters: function (reporters, reporter) {
    return _.compact(this._verify(reporters, 'isReporter', reporter));
  },

  /**
   * Verifies if a driver is given, exists & is valid
   *
   * @method verifyDrivers
   * @return {array} data List of verified drivers
   */

  verifyDrivers: function (drivers, driver) {
    return _.compact(this._verify(drivers, 'isDriver', driver));
  },

  /**
   * Verifies if a driver is given, exists & is valid
   *
   * @method _verify
   * @param {array} check Data that should be mapped
   * @param {string} fn Name of the function that should be invoked on the veryify object
   * @param {object} instance Object instance where the verify function should be invoked
   * @return {array} data List of verified items
   * @private
   */

  _verify: function (check, fn, instance) {
    return check.map(this._verifyIterator.bind(this, fn, instance));
  },

  /**
   * Verifies if a driver is given, exists & is valid
   *
   * @method _verifyIterator
   * @param {string} fn Name of the function that should be invoked on the veryify object
   * @param {object} instance Object instance where the verify function should be invoked
   * @param {string} elm Name of the element that should be checked
   * @return {string|null} element name of the verified element or false if checked failed
   * @priavte
   */

  _verifyIterator: function (fn, instance, elm) {
    return instance[fn](elm) ? elm : false;
  }
};

// export the module
module.exports = Config;
