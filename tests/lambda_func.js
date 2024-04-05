const assert = require('assert');
const {test} = require('./test-util');

module.exports = eva => {
    test(eva,
        `
            (begin
                (def onClick (callback)
                    (begin
                        (var x 10)
                        (var y 20)
                        (callback (+ x y))))
                (onClick (lambda (data) (* data 10)))
            )
        `,
        300);

    // Immediately invoked lambda.
    test(eva,
        `
            (begin
                ((lambda (x) (* x x)) 2)
            )
        `,
        4
    );

    // Store lambda.
    test(eva,
        `
            (begin
                (var square (lambda (x) (* x x)))
                (square 2)  
            )
        `,
        4
    );
}