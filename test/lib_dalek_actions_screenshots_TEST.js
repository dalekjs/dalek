module.exports = {
  'Page title is correct': function (test) {
    'use strict';

    test
      .open('http://localhost/ppjs/#/savings/index')
      .screenshotE('test/screenshots/google2.png','.l-page-content-main')
      //.assert.title().is('Google', 'It has title')
      //.assert.screenshotIsEqualTo('test/screenshots/google.png')
      .done();
  }
};