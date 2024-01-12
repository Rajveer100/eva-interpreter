const assert = require('assert');

/**
 * Eva Interpreter.
 */
class Eva {
    eval(expr) {
        if (isNumber(expr)) {
            return expr;
        }

        if (isString(expr)) {
            return expr.slice(1, -1);
        }

        if (expr[0] === '+') {
            return expr[1] + expr[2];
        }

        throw 'Unimplemented';
    }
}

function isNumber(expr) {
    return typeof expr === 'number';
}

function isString(expr) {
    return typeof expr === 'string' && expr[0] === '"' && expr.slice(-1) === '"';
}

// Tests:

const eva = new Eva();

assert.strictEqual(eva.eval(1), 1);
assert.strictEqual(eva.eval('"hello"'), 'hello');

assert.strictEqual(eva.eval(['+', ['+', 3, 2], 5]), 10);

console.log("All assertions passed!");
