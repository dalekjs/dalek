'use strict';

var expect = require('chai').expect;
//var EventEmitter = require('events').EventEmitter;
var uuid = require('../lib/dalek/uuid.js');

describe('dalek-internal-test', function() {

  it('should exist', function() {
    expect(uuid).to.be.ok;
  });

});
