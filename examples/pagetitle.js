module.exports = {
    // Checks if the <title> of ´github.com´ has the expected value
    'Page title is correct': function (test) {
        'use strict';
        test.expect(1);

        test
            .open('http://github.com')
            .assert.title('GitHub')
            .done();
    }
};
