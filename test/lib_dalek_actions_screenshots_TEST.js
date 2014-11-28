'use strict';

var expect = require('chai').expect;
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var Actions = require('../lib/dalek/actions.js')({reporter: null});

describe('dalek-internal-screenshot-action', function() {

  var actions;

  beforeEach(function () {
    actions = new Actions();
    actions.reporter = new EventEmitter2();
    actions.actionPromiseQueue = [];
  });

  it('should exist', function() {
    expect(actions).to.be.ok;
  });

  it('screenshot action should exist', function() {
    expect(actions.screenshot).to.be.ok;
  });

  it('screenshot action should return link to this', function() {
    expect(actions.screenshot('test/screenshot/file')).to.equal(actions);
  });

  it('screenshot action should add one callback function into action queue', function() {
    expect(actions.actionPromiseQueue.length).to.equal(0);
    actions.screenshot('test/screenshot/file');
    expect(actions.actionPromiseQueue.length).to.equal(1);
    expect(actions.actionPromiseQueue[0]).to.be.an('function');
  });

  it('screenshot action with element should add two callback functions into action queue', function() {
    expect(actions.actionPromiseQueue.length).to.equal(0);
    actions.screenshot('test/screenshot/file', '#lga');
    expect(actions.actionPromiseQueue.length).to.equal(2);
    expect(actions.actionPromiseQueue[1]).to.be.an('function');
  });

});
