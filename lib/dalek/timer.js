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
 * Initializes the timers default values
 *
 * @constructor
 * @class Timer
 */

var Timer = function () {
  this.timerData = [0, 0];
  this.interval = [0, 0];
};

/**
 * Timing module to measure test run times
 *
 * @module DalekJS
 * @class Timer
 * @namespace Dalek
 * @part Timer
 * @api
 */

Timer.prototype = {

  /**
   * Starts the timer
   *
   * @method start
   * @chainable
   */

  start: function () {
    this.timerData = process.hrtime();
    return this;
  },

  /**
   * Stops the timer
   *
   * @method stop
   * @chainable
   */

  stop: function () {
    this.interval = process.hrtime(this.timerData);
    return this;
  },

  /**
   * Returns the elapsed time in ms
   *
   * @method getElapsedTime
   * @return {float}
   */

  getElapsedTime: function () {
    return (this.interval[0]*1e3 + this.interval[1]/1e6) / 1000;
  },

  /**
   * Returns an object with test run time information
   * containing hours, minutes & seconds
   *
   * @method getElapsedTimeFormatted
   * @return {Object}
   */

  getElapsedTimeFormatted: function () {
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
  }
};

// export the timer module
module.exports = Timer;
