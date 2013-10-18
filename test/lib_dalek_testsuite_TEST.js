'use strict';

var expect = require('chai').expect;
var Testsuite = require('../lib/dalek/testsuite.js');

describe('dalek-internal-testsuite', function() {

  it('should exist', function() {
    expect(Testsuite).to.be.ok;
  });

});
