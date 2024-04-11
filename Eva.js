const assert = require('assert');

const Environment = require('./Environment');
const Transformer = require('./transform/Transformer')
const evaParser = require('./parser/eva-parser');

const fs = require('fs');

/**
 * Eva Interpreter.
 */
class Eva {
    /**
     * Creates an Eva instance with the global environment.
     */
    constructor(global = GlobalEnvironment) {
        this.global = global;
        this._transformer = new Transformer();
    }

    evalGlobal(expr) {
        return this._evalBody(expr, this.global);
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
            const [_, ref, value] = expr;

            if (ref[0] === 'prop') {
                const [_tag, instance, propName] = ref;
                const instanceEnv = this.eval(instance, env);

                return instanceEnv.define(
                    propName,
                    this.eval(value, env),
                );
            }

            return env.assign(ref, this.eval(value, env));
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

        // Function declaration: (def square (x) (* x x))
        //
        // Syntactic sugar for: (var square (lambda (x) (* x x)))
        if (expr[0] === 'def') {
            // JIT-transpile to a variable declaration.
            const varExpr = this._transformer.transformDefToLambda(expr);

            return this.eval(varExpr, env);
        }

        // Switch-expression: (switch (cond1, block1) ...)
        //
        // Syntactic sugar for nested if-expressions.
        if (expr[0] === 'switch') {
            const ifExpr = this._transformer.transformSwitchToIf(expr);

            return this.eval(ifExpr, env);
        }

        // For-loop: ( for init condition modifier body )
        //
        // Syntactic sugar for: (begin init (while condition (begin body modifier)))
        if (expr[0] === 'for') {
            const whileExpr = this._transformer.transformForToWhile(expr);

            return this.eval(whileExpr, env);
        }

        // Increment: (++ foo)
        //
        // Syntactic sugar for: (set foo (+ foo 1))
        if (expr[0] === '++') {
            const setExpr = this._transformer.transformIncToSet(expr);

            return this.eval(setExpr, env);
        }

        // Increment: (-- foo)
        //
        // Syntactic sugar for: (set foo (- foo 1))
        if (expr[0] === '--') {
            const setExpr = this._transformer.transformDecToSet(expr);

            return this.eval(setExpr, env);
        }

        // IncrementBy: (+= foo val)
        //
        // Syntactic sugar for: (set foo (+ foo val))
        if (expr[0] === '+=') {
            const setExpr = this._transformer.transformIncByToSet(expr);

            return this.eval(setExpr, env);
        }

        // DecrementBy: (-= foo val)
        //
        // Syntactic sugar for: (set foo (- foo val))
        if (expr[0] === '-=') {
            const setExpr = this._transformer.transformDecByToSet(expr);

            return this.eval(setExpr, env);
        }

        // Lambda declaration: (lambda square (x) (* x x))
        if (expr[0] === 'lambda') {
            const [_tag, params, body] = expr;

            return {
                params,
                body,
                env, // Closure.
            };
        }

        // Class declaration: (class <Name> <Parent> <Body>)
        if (expr[0] === 'class') {
            const [_tag, name, parent, body] = expr;

            const parentEnv = this.eval(parent) || env;
            const classEnv = new Environment({}, parentEnv);

            this._evalBody(body, classEnv);

            return env.define(name, classEnv);
        }

        // Super expressions: (super <Classname>)
        if (expr[0] === 'super') {
            const [_tag, className] = expr;
            return this.eval(className, env).parent;
        }

        if (expr[0] === 'new') {
            const classEnv = this.eval(expr[1], env);
            const instanceEnv = new Environment({}, classEnv);

            const args = expr.slice(2).map(arg => this.eval(arg, env));

            this._callUserDefinedFunction(
                classEnv.lookup('constructor'),
                [instanceEnv, ...args],
            );

            return instanceEnv;
        }

        // Property access: (prop <instance> <name>)
        if (expr[0] === 'prop') {
            const [_tag, instance, name] = expr;

            const instanceEnv = this.eval(instance, env);

            return instanceEnv.lookup(name);
        }

        // Module declaration: (module <body>)
        if (expr[0] === 'module') {
            const [_tag, name, body] = expr;

            const moduleEnv = new Environment({}, env);
            this._evalBody(body, moduleEnv);

            return env.define(name, moduleEnv);
        }

        // Module import: (import <name>)
        if (expr[0] === 'import') {
            const [_tag, name] = expr;

            const moduleSrc = fs.readFileSync(
                `${__dirname}/modules/${name}.eva`,
                'utf-8',
            );

            const body = evaParser.parse(`(begin ${moduleSrc})`);
            const moduleExpr = ['module', name, body];

            return this.eval(moduleExpr, this.global);
        }

        // Function calls:
        //
        // (print "Hello World")
        // (+ x 5)
        // (> foo bar)
        if (Array.isArray(expr)) {
            const fn = this.eval(expr[0], env);
            const args = expr.slice(1).map(arg => this.eval(arg, env));

            // Native function

            if (typeof fn === 'function') {
                return fn(...args);
            }

            // User-defined function

            return this._callUserDefinedFunction(fn, args);
        }

        throw `Unimplemented: ${JSON.stringify(expr)}`;
    }

    _callUserDefinedFunction(fn, args) {
        const activationRecord = {};
        fn.params.forEach((param, index) => {
            activationRecord[param] = args[index]
        });

        const activationEnv = new Environment(
            activationRecord,
            fn.env,
        );

        return this._evalBody(fn.body, activationEnv);
    }

    _evalBody(body, env) {
        if (body[0] === 'begin') {
            return this._evalBlock(body, env);
        }
        return this.eval(body, env);
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

    '+'(op1, op2 = null) {
        if (op2 == null) {
            return op1;
        }
        return op1 + op2;
    },

    '-'(op1, op2) {
        if (op2 == null) {
            return -op1;
        }
        return op1 - op2;
    },

    '*'(op1, op2) {
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
