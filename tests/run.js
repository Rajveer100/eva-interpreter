const Eva = require('../Eva');
const Environment = require('../Environment');

const tests = [
    require('./self_eval'),
    require('./math'),
    require('./var'),
    require('./blocks'),
];

const eva = new Eva(new Environment({
    null: null,

    true: true,
    false: false,

    VERSION: '0.1',
}));

tests.forEach(test => test(eva));

console.log("All assertions passed!");
