const assert = require('assert');

const Environment = require('./Environment');

/**
 * Eva Interpreter.
 */
class Eva {
    /**
     * Creates an Eva instance with the global environment.
     */
    constructor(global = new Environment()) {
        this.global = global;
    }

    /**
     * Evaluates an expression in the given environment.
     */
    eval(expr, env = this.global) {
        // Self-evaluating expressions.

        if (isNumber(expr)) {
            return expr;
        }

        if (isString(expr)) {
            return expr.slice(1, -1);
        }

        // Math Operations:

        if (expr[0] === '+') {
            return this.eval(expr[1], env) + this.eval(expr[2], env);
        }

        if (expr[0] === '-') {
            return this.eval(expr[1], env) - this.eval(expr[2], env);
        }

        if (expr[0] === '*') {
            return this.eval(expr[1], env) * this.eval(expr[2], env);
        }

        if (expr[0] === '/') {
            if (expr[2] === 0) {
                throw 'Cannot divide by zero!';
            }
            return this.eval(expr[1], env) / this.eval(expr[2], env);
        }

        if (expr[0] === '%') {
            if (expr[2] === 0) {
                throw 'Cannot modulo by zero!';
            }
            return this.eval(expr[1], env) % this.eval(expr[2], env);
        }

        // Block: Sequence of expressions.
        if (expr[0] === 'begin') {
            const blockEnv = new Environment({}, env);
            return this._evalBlock(expr, blockEnv);
        }

        // Variable Declaration: (var foo 10)
        if (expr[0] === 'var') {
            const [_, name, value] = expr;
            return env.define(name, this.eval(value, env));
        }

        // Variable Declaration: (set foo 10)
        if (expr[0] === 'set') {
            const [_, name, value] = expr;
            return env.assign(name, this.eval(value, env));
        }

        // Variable Access: foo
        if (isVariableName(expr)) {
            return env.lookup(expr);
        }

        throw `Unimplemented: ${JSON.stringify(expr)}`;
    }

    _evalBlock(block, env) {
        let result;

        const [_tag, ...expressions] = block;
        expressions.forEach(expr => {
            result = this.eval(expr, env);
        });

        return result;
    }
}

function isNumber(expr) {
    return typeof expr === 'number';
}

function isString(expr) {
    return typeof expr === 'string' && expr[0] === '"' && expr.slice(-1) === '"';
}

function isVariableName(expr) {
    return typeof expr === 'string' && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(expr);
}

/**
 * Tests:
 */

const eva = new Eva(new Environment({
    null: null,

    true: true,
    false: false,

    VERSION: '0.1',
}));

assert.strictEqual(eva.eval(1), 1);
assert.strictEqual(eva.eval('"hello"'), 'hello');

// Math:

assert.strictEqual(eva.eval(['+', ['+', 3, 2], 5]), 10);
assert.strictEqual(eva.eval(['-', ['+', 4, 2], 5]), 1);

assert.strictEqual(eva.eval(['+', ['*', 3, 2], 5]), 11);
assert.strictEqual(eva.eval(['-', ['/', 6, 4], 5]), -3.5);
assert.strictEqual(eva.eval(['-', ['%', 6, 4], 5]), -3);

// Variables:

assert.strictEqual(eva.eval(['var', 'x', 10]), 10);
assert.strictEqual(eva.eval('x'), 10);

assert.strictEqual(eva.eval(['var', 'y', 20]), 20);
assert.strictEqual(eva.eval('y'), 20);

assert.strictEqual(eva.eval('VERSION'), '0.1');

// var isUser = true;
assert.strictEqual(eva.eval(['var', 'isUser', 'true']), true);

assert.strictEqual(eva.eval(['var', 'z', ['+', 2, 3]]), 5);
assert.strictEqual(eva.eval('z'), 5);

console.log("All assertions passed!");

// Blocks

assert.strictEqual(eva.eval(
    ['begin',
            ['var', 'x', 10],
            ['var', 'y', 20],
            ['+', ['*', 'x', 'y'], 30],
    ]),
    230);

assert.strictEqual(eva.eval(
    ['begin',
        ['var', 'x', 10],
        ['begin',
            ['var', 'x', 20],
            'x'
        ],
        'x'
    ]),
    10);

assert.strictEqual(eva.eval(
        ['begin',
            ['var', 'x', 10],
            ['begin',
                ['set', 'x', 50],
            ],
            'x'
        ]),
    50);

