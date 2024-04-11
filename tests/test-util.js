const assert = require('assert')
const evaParser = require('../parser/eva-parser');

function test(eva, code, expected) {
    const expr = evaParser.parse(`(begin ${code})`);
    assert.strictEqual(eva.evalGlobal(expr), expected);
}

module.exports = {
  test,
};