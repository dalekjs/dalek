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
var Q = require('q');
var http = require('http');

/**
 * Mimics a real browser that runs in a remote dalek instance
 *
 * @module Remote
 * @class Remote
 * @namespace Dalek
 */

var Remote = {

  /**
   * Remote webdriver path
   *
   * @property path
   * @type {string}
   * @default ''
   */

  path: '',

  /**
   * Remote port
   *
   * @property port
   * @type {integer}
   * @default 9020
   */

  port: 9020,

  /**
   * Remote host
   *
   * @property host
   * @type {string} 
   * @default ''
   */

  host: '',

  /**
   * Url (with placeholders) to launch browsers on the remote instance
   *
   * @property defaultLaunchUrl
   * @type {string} 
   * @default http://{{host}}:{{port}}/dalek/launch/{{browser}}
   */

  defaultLaunchUrl: 'http://{{host}}:{{port}}/dalek/launch/{{browser}}',
  
  /**
   * Url (with placeholders) to kill browsers on the remote instance
   *
   * @property defaultKillUrl
   * @type {string} 
   * @default http://{{host}}:{{port}}/dalek/kill
   */

  defaultKillUrl: 'http://{{host}}:{{port}}/dalek/kill',

  /**
   * Url to start a specific remote browser session
   * 
   * @property launchUrl
   * @type {string} 
   * @default ''
   */

  launchUrl: '',

  /**
   * Url to kill a specific remote browser session
   * 
   * @property killUrl
   * @type {string} 
   * @default ''
   */

  killUrl: '',

  /**
   * Internal config name of the browser to start remotly
   * 
   * @property browser
   * @type {string} 
   * @default '
   */

  browser: '',

  /**
   * Remote browser alias to start a browser
   * (browser.name or browser.actAs or user input browser alias)
   * 
   * @property browserAlias
   * @type {string} 
   * @default '
   */

  browserAlias: '',

  /**
   * Driver defaults
   *
   * @property driverDefaults
   * @type {object}
   */

  driverDefaults: {},

  /**
   * Request secret or false when unsecure
   *
   * @param secret
   * @type {string|bool}
   * @default false
   */

  secret: false,

  /**
   * Stores & validates the incoming browser config
   *
   * @method launch
   * @param {object} configuration Browser configuration
   * @param {EventEmitter2} events EventEmitter (Reporter Emitter instance)
   * @param {Dalek.Internal.Config} config Dalek configuration class
   * @return {object} Browser promise
   */

  launch: function (configuration, events, config) {
    var deferred = Q.defer();

    // store injected configuration/log event handlers
    this.reporterEvents = events;
    this.configuration = configuration;
    this.config = config;

    // load configs
    this._loadConfigs(configuration, config);

    // fire up the remote browser
    var request = http.request(this.launchUrl, this._afterRemoteBrowserLaunched.bind(this, deferred));

    // set secret header if available
    if (this.secret) {
      request.setHeader('secret-token', this.secret);
    }

    // fire the request
    request.end();
    
    return deferred.promise;
  },

  /**
   * Kills the remote browser
   *
   * @method kill
   * @return {object} Promise
   */

  kill: function () {
    http.request(this.killUrl).end();
    return this;
  },

  /**
   * Injects the browser name
   *
   * @method setBrowser
   * @param {string} browser Browser to launch
   * @chainable
   */

  setBrowser: function (browser) {
    this.browser = browser;

    // generate kill & launch url
    this.launchUrl = this._replaceUrlPlaceholder(this.defaultLaunchUrl);
    this.killUrl = this._replaceUrlPlaceholder(this.defaultKillUrl);
    return this;
  },

  /**
   * Listens on the response of the initial browser launch call
   * and collects the response data, fires the _handshakeFinished call
   * after the response ended
   *
   * @method _afterRemoteBrowserLaunched
   * @param {object} deferred Promise
   * @param {object} response Browser launch response object
   * @chainable
   * @private
   */

  _afterRemoteBrowserLaunched: function (deferred, response) {
    // collect remote browser information and
    // start the test execution after the handshake finished
    var data = [];
    response.on('data', function (chunk) {
      data.push(chunk+'');
    }).on('end', this._handshakeFinished.bind(this, deferred, data));
    return this;
  },

  /**
   * Parses the response data of the initial browser handshake,
   * sets the longName, desiredCapabilities & driverDefaults,
   * emits the browser data (can be used by reporters & drivers)
   *
   * @method _handshakeFinished
   * @param {object} deferred Promise
   * @param {array} data Remote browser data (longName, desiredCapabilities, driverDefaults)
   * @chainable
   * @private
   */

  _handshakeFinished: function (deferred, data) {
    var br = JSON.parse(data);

    // check if an error happened
    if (!!br.error) {
      this.reporterEvents.emit('error', br.error);
      return this;
    }

    // update the desired capabilities & browser defaults in the remote instance
    this.longName = br.name;
    this.desiredCapabilities = br.caps;
    this.driverDefaults = br.defaults;

    // update the desired capabilities & browser defaults in the driver instance
    this.reporterEvents.emit('browser:notify:data:' + this.browser, {desiredCapabilities: this.desiredCapabilities, defaults: this.driverDefaults});

    deferred.resolve();
    return this;
  },

  /**
   * Sets the host & port of the remote instance,
   * extracts the remote browser to call,
   * generates the launch & kill objects for this session
   *
   * @method _loadConfigs
   * @param {object} configuration Browser session configuration
   * @param {object} config Dalek configuration data
   * @chainable
   * @private
   */

  _loadConfigs: function (configuration, config) {
    // set host & port
    this.host = configuration.host ? configuration.host : this.host;
    this.port = configuration.port ? configuration.port : this.port;

    // get the browser alias & secret
    this.browserAlias = this.browser;
    var browserConfig = config.get('browsers');
    if (browserConfig && browserConfig[0] && browserConfig[0][this.browser]) {
      this.browserAlias = browserConfig[0][this.browser].actAs ? browserConfig[0][this.browser].actAs : this.browserAlias;
      this.browserAlias = browserConfig[0][this.browser].name ? browserConfig[0][this.browser].name : this.browserAlias;
      this.secret = browserConfig[0][this.browser].secret ? browserConfig[0][this.browser].secret : this.secret;
    }

    // generate kill & launch url
    this.launchUrl = this._replaceUrlPlaceholder(this.defaultLaunchUrl);
    this.killUrl = this._replaceUrlPlaceholder(this.defaultKillUrl);

    return this;
  },

  /**
   * Replaces {{host}}, {{port}} & {{browser}} placeholders
   * in the given url with data from this.host, this.port & this.browserAlias
   *
   * @method _replaceUrlPlaceholder
   * @param {string} url Url with placeholder
   * @return {string} Url with replaced placeholders
   * @private
   */

  _replaceUrlPlaceholder: function (url) {
    url = url.replace('{{port}}', this.port).replace('{{host}}', this.host).replace('{{browser}}', this.browserAlias);
    return url;
  }
};

module.exports = Remote;