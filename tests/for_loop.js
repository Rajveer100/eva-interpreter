const assert = require('assert');
const {test} = require('./test-util');

/**
 * for <init>
 *     <condition>
 *     <modifier>
 *     <expr>
 */

module.exports = eva => {
    test(eva,
        `
            (begin
                (var result 0)
                
                (for (var counter 0)
                     (< counter 10)
                     (set counter (+ counter 1))  
                     (begin
                         (set result (+ result 1))
                     )) 
            )
        `, 10);

    test(eva,
        `
            (begin
                (var result 0)
                
                (for (var counter 0)
                     (< counter 10)
                     (++ counter)  
                     (begin
                         (set result (+ result 1))
                     )) 
            )
        `, 10);

    test(eva,
        `
            (begin
                (var result 0)
                
                (for (var counter 10)
                     (> counter 0)
                     (-- counter)  
                     (begin
                         (+= result 1)
                     )) 
                result
            )
        `, 10);

    test(eva,
        `
            (begin
                (var result 0)
                
                (for (var counter 0)
                     (< counter 10)
                     (+= counter 2)  
                     (begin
                         (set result (+ result 1))
                     )) 
                result
            )
        `, 5);

    test(eva,
        `
            (begin
                (var result 5)
                
                (for (var counter 10)
                     (> counter 0)
                     (-= counter 2)  
                     (begin
                         (-= result 1)
                     )) 
                result
            )
        `, 0);
};