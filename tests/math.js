const assert = require('assert');

module.exports = eva => {
    assert.strictEqual(eva.eval(['+', ['+', 3, 2], 5]), 10);
    assert.strictEqual(eva.eval(['-', ['+', 4, 2], 5]), 1);

    assert.strictEqual(eva.eval(['+', ['*', 3, 2], 5]), 11);
    assert.strictEqual(eva.eval(['-', ['/', 6, 4], 5]), -3.5);
    assert.strictEqual(eva.eval(['-', ['%', 6, 4], 5]), -3);
}
