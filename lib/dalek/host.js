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
var http = require('http');
var os = require('os');
var Q = require('q');

/**
 * Sets the configuration options for the 
 * dalek remote browser executor
 *
 * @param {options} opts Configuration options
 * @constructor
 */

var Host = function (opts) {
  this.reporterEvents = opts.reporterEvents;
  this.config = opts.config;
};

/**
 * Remote Dalek host proxy
 *
 * @module Dalek
 * @class Host
 * @part Remote
 * @api
 */

Host.prototype = {

  /**
   * Default port that the Dalek remote server is linking against
   *
   * @property defaultPort
   * @type {integer}
   * @default 9020
   */

  defaultPort: 9020,

  /**
   * Instance of the local browser
   *
   * @property bro
   * @type {object}
   * @default null
   */

  bro: null,

  /**
   * Instance of the reporter event emitter
   *
   * @property reporterEvents
   * @type {EventEmitter2}
   * @default null
   */

  reporterEvents: null,
  
  /**
   * Instance of the dalek config
   *
   * @property config
   * @type {Dalek.Config}
   * @default null
   */

  config: null,

  /**
   * Local configuration
   *
   * @property configuration
   * @type {object}
   * @default {}
   */
  
  configuration: {},

  /**
   * Host address of the called webdriver server
   *
   * @property remoteHost
   * @type {string}
   * @default null
   */

  remoteHost: null,

  /**
   * Path of the webdriver server endpoint
   *
   * @property remotePath
   * @type {string}
   * @default null
   */

  remotePath: null,

  /**
   * Port of the called webdriver server
   *
   * @property remotePort
   * @type {string}
   * @default null
   */

  remotePort: null,

  /**
   * Secret that got emitted by the remote instance
   *
   * @property remoteSecret
   * @type {string}
   * @default null
   */

  remoteSecret: null,

  /**
   * Identifier of the remote client
   *
   * @property remoteId
   * @type {string}
   * @default null
   */

  remoteId: null,

  /**
   * Secret that is stored in the local instance
   *
   * @property secret
   * @type {string}
   * @default null
   */

  secret: null,

  /**
   * Incoming message that needs to be proxied
   * to the local webdriver server 
   *
   * @property proxyRequest
   * @type {http.IncomingMessage}
   * @default null
   */

  proxyRequest: null,

  /**
   * Starts the remote proxy server,
   * prepares the config
   *
   * @method run
   * @param {object} opts Configuration options
   * @chainable
   */

  run: function (opts) {
    // apply configuration
    this.configuration = this.config.get('host') || {};
    this.configuration.host = this.configuration.host ? !this.configuration.port : 'localhost';
    this.secret = this.configuration.secret ? this.configuration.secret : this.secret;
    if (!this.configuration.port || opts.port) {
      this.configuration.port = opts.port ? opts.port : this.defaultPort;
    }
    
    // start the proxy server// emit the instance ready event
    this.server = http.createServer(this._createServer.bind(this)).listen(this.configuration.port, this.reporterEvents.emit.bind(this.reporterEvents, 'report:remote:ready', {ip: this._getLocalIp(), port: this.configuration.port}));
    return this;
  },

  /**
   * Shutdown the proxy server
   *
   * @method kill
   * @return {object} Promise 
   */

  kill: function () {
    var deferred = Q.defer();
    this.server.close(deferred.resolve);
    return deferred.promise;
  },

  /**
   * Launches the local browser
   * 
   * @method _launcher
   * @param {object} request Request from the dalek remote caller
   * @param {object} response Response to the dalek remote caller
   * @private
   * @chainable
   */

  _launcher: function (request, response) {
    // extract the browser id from the request url
    var browser = this._extractBrowser(request.url);

    // load local browser module
    this.bro = this._loadBrowserModule(browser, response);

    // launch the local browser
    if (this.bro) {
      this.bro
        .launch({}, this.reporterEvents, this.config)
        .then(this._onBrowserLaunch.bind(this, browser, response));
    }

    return this;
  },

  /**
   * Shuts the local browser down,
   * end the otherwise hanging request
   * 
   * @method _launcher
   * @param {object} response Response to the dalek remote caller
   * @private
   * @chainable
   */
  
  _killer: function (response) {
    if (this.bro) {
      this.bro.kill();
    }
    response.setHeader('Connection', 'close');
    response.end();
    this.reporterEvents.emit('report:remote:closed', {id: this.remoteId, browser: this.bro.longName});
    return this;
  },

  /**
   * Requires the local browser module & returns it
   * 
   * @method _loadBrowserModule
   * @param {string} browser Name of the browser to load
   * @param {object} response Response to the dalek remote caller
   * @return {object} The local browser module
   * @private
   */

  _loadBrowserModule: function (browser, response) {
    var bro = null;
    try {
      bro = require('dalek-browser-' + browser);
    } catch (e) {
      try {
        bro = require('dalek-browser-' + browser + '-canary');
      } catch (e) {
        response.setHeader('Connection', 'close');
        response.end(JSON.stringify({error: 'The requested browser "' + browser + '" could not be loaded'}));
      }
    }

    return bro;
  },

  /**
   * Stores network data from the local browser instance,
   * sends browser specific data to the client
   * 
   * @method _onBrowserLaunch
   * @param {string} browser Name of the browser to load
   * @param {object} response Response to the dalek remote caller
   * @chainable
   * @private
   */

  _onBrowserLaunch: function (browser, response) {
    this.remoteHost = this.bro.getHost();
    this.remotePort = this.bro.getPort();
    this.remotePath = this.bro.path.replace('/', '');
    this.reporterEvents.emit('report:remote:established', {id: this.remoteId, browser: this.bro.longName});
    response.setHeader('Connection', 'close');
    response.end(JSON.stringify({browser: browser, caps: this.bro.desiredCapabilities, defaults: this.bro.driverDefaults, name: this.bro.longName}));
    return this;
  },

  /**
   * Dispatches all incoming requests,
   * possible endpoints local webdriver server, 
   * browser launcher, browser shutdown handler
   * 
   * @method _createServer
   * @param {object} request Request from the dalek remote caller
   * @param {object} response Response to the dalek remote caller
   * @private
   * @chainable
   */

  _createServer: function (request, response) {
    // delegate calls based on url
    if (request.url.search('/dalek/launch/') !== -1) {
      
      // store the remotes ip address
      this.remoteId = request.connection.remoteAddress;

      // store the remote secret
      if (request.headers['secret-token']) {
        this.remoteSecret = request.headers['secret-token'];
      }

      // check if the secrets match, then launch browser
      // else emit an error
      if (this.secret === this.remoteSecret) {
        this._launcher(request, response);
      } else {
        response.setHeader('Connection', 'close');
        response.end(JSON.stringify({error: 'Secrets do not match'}));
      }

    } else if (request.url.search('/dalek/kill') !== -1) {
      this._killer(response);
    } else {
      this.proxyRequest = http.request(this._generateProxyRequestOptions(request.headers, request.method, request.url), this._onProxyRequest.bind(this, response, request));
      request.on('data', this._onRequestDataChunk.bind(this));
      request.on('end', this.proxyRequest.end.bind(this.proxyRequest));
    }

    return this;
  },

  /**
   * Proxies data from the local webdriver server to the client
   * 
   * @method _onRequestDataChunk
   * @param {buffer} chunk Chunk of the incoming request data
   * @private
   * @chainable
   */

  _onRequestDataChunk: function (chunk) {
    this.proxyRequest.write(chunk, 'binary');
    return this;
  },

  /**
   * Proxies remote data to the webdriver server
   * 
   * @method _onProxyRequest
   * @param {object} request Request from the dalek remote caller
   * @param {object} response Response to the dalek remote caller
   * @param {object} res Response to the local webdriver server
   * @private
   * @chainable
   */

  _onProxyRequest: function (response, request, res) {
    var chunks = [];

    // deny access if the remote ids (onitial request, webdriver request) do not match
    if (this.remoteId !== request.connection.remoteAddress) {
      response.setHeader('Connection', 'close');
      response.end();
      return this;
    }

    res.on('data', function (chunk) {
      chunks.push(chunk+'');
    }).on('end', this._onProxyRequestEnd.bind(this, res, response, request, chunks));
    return this;
  },

  /**
   * Handles data exchange between the client and the
   * local webdriver server
   * 
   * @method _onProxyRequest
   * @param {object} request Request from the dalek remote caller
   * @param {object} response Response to the dalek remote caller
   * @param {object} res Response to the local webdriver server
   * @param {array} chunks Array of received data pieces that should be forwarded to the local webdriver server
   * @private
   * @chainable
   */

  _onProxyRequestEnd: function (res, response, request, chunks) {
    var buf = '';

    // proxy headers for the session request
    if (request.url === '/session') {
      response.setHeader('Connection', 'close');
      Object.keys(res.headers).forEach(function (key) {
        response.setHeader(key, res.headers[key]);
      });
    }

    if (chunks.length) {
      buf = chunks.join('');
    }

    response.write(buf);
    response.end();
    return this;
  },

  /**
   * Extracts the browser that should be launched
   * from the launch url request
   *
   * @method _extractBrowser
   * @param {string} url Url to parse
   * @return {string} Extracted browser
   * @private
   */

  _extractBrowser: function (url) {
    return url.replace('/dalek/launch/', '');
  },

  /**
   * Generates the request options from the incoming
   * request that should then be forwared to the local
   * webdriver server
   *
   * @method _generateProxyRequestOptions
   * @param {object} header Header meta data
   * @param {string} method HTTP method
   * @param {string} url Webriver server endpoint url
   * @return {object} Request options
   * @private
   */

  _generateProxyRequestOptions: function (headers, method, url) {
    var options = {
      host: this.remoteHost,
      port: this.remotePort,
      path: this.remotePath + url,
      method: method,
      headers: {
        'Content-Type': headers['content-type'],
        'Content-Length': headers['content-length']
      }
    };

    // check if the path is valid,
    // else prepend a `root` slash
    if (options.path.charAt(0) !== '/') {
      options.path = '/' + options.path;
    }

    return options;
  },

  /**
   * Gets the local ip address
   * (should be the IPv4 address where the runner is accessible from)
   *
   * @method _getLocalIp
   * @return {string} Local IP address
   * @private
   */

  _getLocalIp: function () {
    var ifaces = os.networkInterfaces();
    var address = [null];
    for (var dev in ifaces) {
      var alias = [0];
      ifaces[dev].forEach(this._grepIp.bind(this, alias, address));
    }

    return address[0];
  },

  /**
   * Tries to find the local IP address
   *
   * @method _grepIp
   * @param
   * @param
   * @param
   * @chainable
   * @private
   */

  _grepIp:  function (alias, address, details) {
    if (details.family === 'IPv4') {
      if (details.address !== '127.0.0.1') {
        address[0] = details.address;
      }
      ++alias[0];
    }

    return this;
  }

};

module.exports = Host;