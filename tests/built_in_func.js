const assert = require('assert');
const {test} = require('./test-util');

module.exports = eva => {
    test(eva, `(+ 1 5)`, 6);

    // Math functions

    assert.strictEqual(eva.eval(['+', ['+', 3, 2], 5]), 10);
    assert.strictEqual(eva.eval(['+', ['*', 3, 2], 5]), 11);

    // Comparison

    test(eva, `(> 1 2)`, false);
    test(eva, `(< 1 2)`, true);

    test(eva, `(>= 2 2)`, true);
    test(eva, `(<= 2 2)`, true);
    test(eva, `(= 2 2)`, true);
}