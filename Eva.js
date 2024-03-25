const assert = require('assert');

const Environment = require('./Environment');

/**
 * Eva Interpreter.
 */
class Eva {
    /**
     * Creates an Eva instance with the global environment.
     */
    constructor(global = GlobalEnvironment) {
        this.global = global;
    }

    /**
     * Evaluates an expression in the given environment.
     */
    eval(expr, env = this.global) {
        // Self-evaluating expressions.

        if (this._isNumber(expr)) {
            return expr;
        }

        if (this._isString(expr)) {
            return expr.slice(1, -1);
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
        if (this._isVariableName(expr)) {
            return env.lookup(expr);
        }

        // if-expression:
        if (expr[0] === 'if') {
            const [_tag, condition, consequent, alternate] = expr;
            if (this.eval(condition, env)) {
                return this.eval(consequent, env);
            }
            return this.eval(alternate, env);
        }

        if (expr[0] === 'while') {
            const [_tag, condition, body] = expr;
            let result;
            while (this.eval(condition, env)) {
                result = this.eval(body, env);
            }
            return result;
        }

        // Function calls:
        //
        // (print "Hello World")
        // (+ x 5)
        // (> foo bar)
        if (Array.isArray(expr)) {
            const fn = this.eval(expr[0], env);
            const args = expr .slice(1).map(arg => this.eval(arg, env));

            // Native function

            if (typeof fn === 'function') {
                return fn(...args);
            }

            // User-defined function
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

    _isNumber(expr) {
        return typeof expr === 'number';
    }

    _isString(expr) {
        return typeof expr === 'string' && expr[0] === '"' && expr.slice(-1) === '"';
    }

    _isVariableName(expr) {
        return typeof expr === 'string' && /^[+\-*/%<>=a-zA-Z0-9_]+$/.test(expr);
    }
}

/**
 * Default Global Environment.
 */
const GlobalEnvironment = new Environment({
    null: null,

    true: true,
    false: false,

    VERSION: '0.1',

    // Operators

    '+'(op1, op2) {
        return op1 + op2;
    },

    '-'(op1, op2) {
        return op1 - op2;
    },

    '*'(op1, op2 = null) {
        if (op2 == null) {
            return -op1;
        }
        return op1 * op2;
    },

    '/'(op1, op2) {
        if (op2 === 0) {
            throw 'Cannot modulo by zero!';
        }
        return op1 / op2;
    },

    '%'(op1, op2) {
        if (op2 === 0) {
            throw 'Cannot modulo by zero!';
        }
        return op1 % op2;
    },

    // Comparison

    '>'(op1, op2) {
        return op1 > op2;
    },

    '<'(op1, op2) {
        return op1 < op2;
    },

    '>='(op1, op2) {
        return op1 >= op2;
    },

    '<='(op1, op2) {
        return op1 <= op2;
    },

    '='(op1, op2) {
        return op1 === op2;
    },

    // Console Output

    print(...args) {
        console.log(...args);
    },
});

module.exports = Eva;
