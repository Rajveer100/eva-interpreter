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

        // Comparison Operators:
        if (expr[0] === '>') {
            return this.eval(expr[1], env) > this.eval(expr[2], env);
        }

        if (expr[0] === '>=') {
            return this.eval(expr[1], env) >= this.eval(expr[2], env);
        }

        if (expr[0] === '<') {
            return this.eval(expr[1], env) < this.eval(expr[2], env);
        }

        if (expr[0] === '<=') {
            return this.eval(expr[1], env) <= this.eval(expr[2], env);
        }

        if (expr[0] === '=') {
            return this.eval(expr[1], env) === this.eval(expr[2], env);
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

module.exports = Eva;
