'use strict';

var expect = require('chai').expect;
var Dalek = require('../lib/dalek.js');

describe('dalek', function () {

  it('should exist', function () {
    expect(Dalek).to.be.ok;
  });

  it('can shutdown on empty tests', function () {
    var oldProcessExit = process.exit;
    process.exit = function (code) {
      expect(code).to.equal(127);
    };

    var dalek = new Dalek({
      tests: '',
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: true,
      noSymbols: false,
      advanced: true
    });

    dalek.driverEmitter.on('killAll', function () {
      expect(true).to.be.true;
    });

    process.exit = oldProcessExit;
  });

  it('can be initialized', function () {
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false
    });
    expect(dalek).to.be.ok;
  });

  it('can fire run finished event', function () {
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false
    });

    dalek.reporterEvents.on('report:runner:finished', function (data) {
      expect(data).to.be.an('object');
    });

    dalek.reportRunFinished();
  });

  it('can fire tests complete event', function () {
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false
    });

    dalek.driverEmitter.on('tests:complete', function () {
      expect(true).to.be.ok;
    });

    dalek.testsuitesFinished();
  });

  it('can update assertion state (success)', function () {
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false
    });

    dalek._onReportAssertion({success: true});
    expect(dalek.assertionsPassed).to.equal(1);
    expect(dalek.assertionsFailed).to.equal(0);
    expect(dalek.runnerStatus).to.be.true;
  });

  it('can update assertion state (failure)', function () {
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false
    });

    dalek._onReportAssertion({success: false});
    expect(dalek.assertionsPassed).to.equal(0);
    expect(dalek.assertionsFailed).to.equal(1);
    expect(dalek.runnerStatus).to.be.false;
  });

  it('can detect advanced options', function () {
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false,
      advanced: true
    });

    expect(dalek.advancedOptions).to.be.true;
  });

  /*it('can run tests', function () {
    var EventEmitter = require('events').EventEmitter;
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false
    });

    dalek.reporterEvents = new EventEmitter();
    dalek.reporterEvents.setMaxListeners(Infinity);
    dalek.reporterEvents.on('report:runner:started', function () {
      expect(true).to.be.true;
    });
    dalek.run();
  });*/

  /*it('can catch runtime errors', function () {
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false
    });

    dalek.driverEmitter.on('killAll', function () {
      expect(true).to.be.true;
    });

    try {
      dalek._shutdown({});
    } catch (e) {}
  });*/

  /*it('can doenst fire at appium runtime errors', function () {
    var dalek = new Dalek({
      tests: ['test/dalek/basic.js'],
      driver: [],
      reporter: [],
      browser: [],
      logLevel: 1,
      noColors: false,
      noSymbols: false
    });

    try {
      expect(dalek._shutdown({message: 'This socket has been ended by the other party'})).to.be.false;
    } catch (e) {}
  });*/

});
