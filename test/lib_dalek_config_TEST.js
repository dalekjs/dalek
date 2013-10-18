'use strict';

var expect = require('chai').expect;
var Config = require('../lib/dalek/config.js');

describe('dalek-internal-config', function () {

  it('should exist', function () {
    expect(Config).to.be.ok;
  });

  it('can be initialized', function () {
    var config = new Config({}, {tests: []}, {});
    expect(config).to.be.ok;
  });

  it('can get a value', function () {
    var config = new Config({foo: 'bar'}, {tests: []}, {});
    expect(config.get('foo')).to.equal('bar');
  });

  it('can read & parse a yaml file', function () {
    var config = new Config({}, {tests: []}, {});
    var fileContents = config.readyml(__dirname + '/mock/Dalekfile.yml');
    expect(fileContents).to.include.keys('browsers');
    expect(fileContents.browsers).to.be.an('array');
    expect(fileContents.browsers[0]).to.be.an('object');
    expect(fileContents.browsers[0]).to.include.keys('chrome');
    expect(fileContents.browsers[0].chrome).to.include.keys('port');
    expect(fileContents.browsers[0].chrome.port).to.equal(6000);
  });

  it('can read & parse a json file', function () {
    var config = new Config({}, {tests: []}, {});
    var fileContents = config.readjson(__dirname + '/mock/Dalekfile.json');
    expect(fileContents).to.include.keys('browsers');
    expect(fileContents.browsers).to.be.an('array');
    expect(fileContents.browsers[0]).to.be.an('object');
    expect(fileContents.browsers[0]).to.include.keys('chrome');
    expect(fileContents.browsers[0].chrome).to.include.keys('port');
    expect(fileContents.browsers[0].chrome.port).to.equal(6000);
  });

  it('can read & parse a json5 file', function () {
    var config = new Config({}, {tests: []}, {});
    var fileContents = config.readjson5(__dirname + '/mock/Dalekfile.json5');
    expect(fileContents).to.include.keys('browsers');
    expect(fileContents.browsers).to.be.an('array');
    expect(fileContents.browsers[0]).to.be.an('object');
    expect(fileContents.browsers[0]).to.include.keys('chrome');
    expect(fileContents.browsers[0].chrome).to.include.keys('port');
    expect(fileContents.browsers[0].chrome.port).to.equal(6000);
  });

  it('can read & parse a js file', function () {
    var config = new Config({}, {tests: []}, {});
    var fileContents = config.readjs(__dirname + '/mock/Dalekfile.js');
    expect(fileContents).to.include.keys('browsers');
    expect(fileContents.browsers).to.be.an('array');
    expect(fileContents.browsers[0]).to.be.an('object');
    expect(fileContents.browsers[0]).to.include.keys('chrome');
    expect(fileContents.browsers[0].chrome).to.include.keys('port');
    expect(fileContents.browsers[0].chrome.port).to.equal(6000);
  });

  it('can read & parse a coffee-script file', function () {
    var config = new Config({}, {tests: []}, {});
    var fileContents = config.readcoffee(__dirname + '/mock/Dalekfile.coffee');
    expect(fileContents).to.include.keys('browsers');
    expect(fileContents.browsers).to.be.an('array');
    expect(fileContents.browsers[0]).to.be.an('object');
    expect(fileContents.browsers[0]).to.include.keys('chrome');
    expect(fileContents.browsers[0].chrome).to.include.keys('port');
    expect(fileContents.browsers[0].chrome.port).to.equal(6000);
  });

  it('can check the avilability of a config file', function () {
    var config = new Config({}, {tests: []}, {});
    var path = __dirname + '/mock/Dalekfile.coffee';
    expect(config.checkAvailabilityOfConfigFile(path)).to.equal(path);
  });

  it('can verify a reporter', function () {
    var config = new Config({}, {tests: []}, {});
    var reporter = {
      isReporter: function () {
        return true;
      }
    };

    var reporters = ['foobar'];
    expect(config.verifyReporters(reporters, reporter)[0]).to.equal(reporters[0]);
  });

  it('can verify a driver', function () {
    var config = new Config({}, {tests: []}, {});
    var driver = {
      isDriver: function () {
        return true;
      }
    };

    var drivers = ['foobar'];
    expect(config.verifyDrivers(drivers, driver)[0]).to.equal(drivers[0]);
  });

  it('can return the previous filename if the _checkFile iterator foudn a file', function () {
    var config = new Config({}, {tests: []}, {});
    expect(config._checkFile('foobarbaz', '', '', '')).to.equal('foobarbaz');
  });

  it('can check the existance of default config files', function () {
    var config = new Config({}, {tests: []}, {});
    config.defaultFilename = __dirname + '/mock/Dalekfile';
    expect(config._checkFile('js', 'coffee', 0, ['js', 'coffee'])).to.equal(__dirname + '/mock/Dalekfile.js');
  });

  it('can check the existance of default config files (1st in row doesnt exist, snd. does)', function () {
    var config = new Config({}, {tests: []}, {});
    config.defaultFilename = __dirname + '/mock/Dalekfile';
    expect(config._checkFile('txt', 'coffee', 0, ['txt', 'coffee'])).to.equal(__dirname + '/mock/Dalekfile.coffee');
  });

});
