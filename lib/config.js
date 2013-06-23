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
require('coffee-script');

/**
 * @constructor
 * @class Config
 */

var Config = function (defaults, opts) {
  this.defaultFilename = 'Dalekfile';
  this.supportedExtensions = ['yml', 'json5', 'json', 'js', 'coffee'];
  this.config = this.load(defaults, opts.config, opts);
};


/**
 * @module Config
 */

module.exports = function (defaults, opts) {
  return new Config(defaults, opts);
};

/**
 *
 * @method checkAvailabilityOfConfigFile
 * @param {String} pathname
 * @return {String} config file path
 */

Config.prototype.checkAvailabilityOfConfigFile = function (pathname) {
  var configFilePath = null;

  // check if a pathname is given,
  // then check if the file is available
  if (pathname && fs.existsSync(pathname)) {
    return fs.realpathSync(pathname);
  }

  // check if any of the default configuration files is available
  this.supportedExtensions.forEach(function (ext) {
    var fileToCheck = this.defaultFilename + '.' + ext;
    if (!configFilePath && fs.existsSync(fileToCheck)) {
      configFilePath = fs.realpathSync(fileToCheck);
    }
  }.bind(this));

  return configFilePath;
};

/**
 *
 */

Config.prototype.load = function (defaults, pathname, opts) {
  var file = this.checkAvailabilityOfConfigFile(pathname);
  var data = this.loadFile(file);

  if (opts.tests.length === 0) {
    delete opts.tests;
  }

  return _.merge(defaults, data, opts);
};

/**
 *
 */

Config.prototype.loadFile = function (pathname) {
  var data = {};
  var ext = path.extname(pathname).replace('.', '');

  switch (ext) {
  case 'yml':
    data = this.readYaml(pathname);
    break;
  case 'json5':
    data = this.readJson5(pathname);
    break;
  case 'json':
    data = this.readJson(pathname);
    break;
  case 'js':
    data = this.readJS(pathname);
    break;
  case 'coffee':
    data = this.readCoffee(pathname);
    break;
  }

  return data;
};

/**
 *
 */

Config.prototype.get = function (item) {
  return this.config[item] || null;
};

/**
 *
 */

Config.prototype.readJson = function () {
  var contents = fs.readFileSync(this.defaultFilename + '.json', 'utf8');
  return JSON.parse(contents);
};

/**
 *
 */

Config.prototype.readJson5 = function () {
  var contents = fs.readFileSync(this.defaultFilename + '.json5', 'utf8');
  return JSON5.parse(contents);
};

/**
 *
 */

Config.prototype.readYaml = function () {
  var contents = fs.readFileSync(this.defaultFilename + '.yml', 'utf8');
  return yaml.load(contents);
};

/**
 *
 */

Config.prototype.readJS = function () {
  return require(this.defaultFilename, 'utf8');
};

/**
 *
 */

Config.prototype.readCoffee = function () {
  return require(this.defaultFilename, 'utf8');
};

/**
 *
 */

Config.prototype.verifyReporters = function (reporters, reporter) {
  reporters = _.map(reporters, function (rep) {
    if (reporter.isReporter(rep)) {
      return rep;
    }
  }.bind(this));
  return _.compact(reporters);
};

/**
 *
 */

Config.prototype.verifyDrivers = function (drivers, driver) {
  drivers = _.map(drivers, function (drv) {
    if (driver.isDriver(drv)) {
      return drv;
    }
  }.bind(this));
  return _.compact(drivers);
};
