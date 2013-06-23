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

/**
 * @constructor
 * @class Timer
 */

var Timer = function () {
  this.timerData = [0, 0];
  this.interval = [0, 0];
};

/**
 * @module Timer
 */

module.exports = function () {
  return new Timer();
};

/**
 *
 * @method start
 * @return {Timer}
 */

Timer.prototype.start = function () {
  this.timerData = process.hrtime();
  return this;
};

/**
 *
 * @method stop
 * @return {Timer}
 */

Timer.prototype.stop = function () {
  this.interval = process.hrtime(this.timerData);
  return this;
};

/**
 *
 * @method getElapsedTime
 * @return {float}
 */

Timer.prototype.getElapsedTime = function () {
  return (this.interval[0]*1e3 + this.interval[1]/1e6) / 1000;
};

/**
 *
 * @method getElapsedTimeFormatted
 * @return {Object}
 */

Timer.prototype.getElapsedTimeFormatted = function () {
  var hours, minutes, seconds;
  var elapsedTimeInSeconds = this.getElapsedTime();

  // assign elapsed time (in seconds) to the seconds output
  seconds = elapsedTimeInSeconds;

  // check if the elapsed time in seconds is more than a minute
  // and convert the raw seconds to minutes & seconds
  if (elapsedTimeInSeconds > 60) {
    minutes = Math.floor(elapsedTimeInSeconds / 60);
    seconds = elapsedTimeInSeconds - minutes * 60;
  }

  // check if the elapsed time in minutes is more than an hour
  // and convert the raw seconds to hours, minutes & seconds
  if (minutes > 60) {
    hours = Math.floor(elapsedTimeInSeconds / 3600);
    minutes = elapsedTimeInSeconds - hours * 60;
    seconds = elapsedTimeInSeconds - minutes * 3600;
  }

  return {hours: hours, minutes: minutes, seconds: seconds};
};
