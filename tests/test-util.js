const assert = require('assert')
const evaParser = require('../parser/eva-parser');

function test(eva, code, expected) {
    const expr = evaParser.parse(code);
    assert.strictEqual(eva.eval(expr), expected);
}

module.exports = {
  test,
};