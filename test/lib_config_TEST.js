'use strict';

var expect = require('chai').expect;

describe('dalek', function() {

  it('should get default config filename', function(){
    var config = require('../lib/config')({}, {config: {}, tests: []});
    expect(config.defaultFilename).to.equal('Dalekfile');
  });

});
