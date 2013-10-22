'use strict';

var expect = require('chai').expect;
var Timer = require('../lib/dalek/timer.js');

describe('dalek-internal-timer', function () {

  it('should exist', function () {
    expect(Timer).to.be.ok;
  });

  it('can be instanciated', function () {
    var timer = new Timer();
    expect(timer).to.be.ok;
  });

  it('can be started', function () {
    var timer = new Timer();
    expect(timer.timerData[0]).to.equal(0);
    expect(timer.timerData[1]).to.equal(0);
    timer.start();
    expect(timer.timerData[0]).to.be.above(0);
    expect(timer.timerData[1]).to.be.above(0);
  });

  /*it('can be stopped', function (done) {
    var timer = new Timer();
    timer.start();
    expect(timer.interval[0]).to.equal(0);
    expect(timer.interval[1]).to.equal(0);
    setTimeout(function () {
      timer.stop();
      expect(timer.interval[1]).to.be.above(0);
      done();
    }, 200);
  });

  it('can return elapsed time in seconds', function () {
    var timer = new Timer();
    timer.interval = [0, 100769];
    expect(timer.getElapsedTime()).to.be.above(1);
  });

  /*it('can return formatted time object (seconds)', function (done) {
    var timer = new Timer();
    timer.interval = [0, 20000729769];
    var elapsedTime = timer.getElapsedTimeFormatted();
    expect(elapsedTime.seconds).to.be.above(1);
    expect(elapsedTime.minutes).to.be.undefined;
    expect(elapsedTime.hours).to.be.undefined;
  });

  it('can return formatted time object (minutes)', function () {
    var timer = new Timer();
    timer.interval = [0, 1653];
    var elapsedTime = timer.getElapsedTimeFormatted();
    expect(elapsedTime.minutes).to.be.above(1);
  });

  it('can return formatted time object (hours)', function () {
    var timer = new Timer();
    timer.interval = [0, 9884759729357435616536595610];
    var elapsedTime = timer.getElapsedTimeFormatted();
    expect(elapsedTime.hours).to.be.above(1);
  });*/

});
