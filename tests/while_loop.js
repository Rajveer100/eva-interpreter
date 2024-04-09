const assert = require('assert');
const {test} = require('./test-util');

/**
 * while <condition>
 *       <expr>
 *       <modifier>
 */

module.exports = eva => {
    test(eva,
        `
            (begin
                (var counter 0)
                (var result 0)
                
                (while (< counter 10)
                    (begin
                        (set result (+ result 1))
                        (set counter (+ counter 1)))) 
            )
        `, 10);
};