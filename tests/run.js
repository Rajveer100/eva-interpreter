const Eva = require('../Eva');
const Environment = require('../Environment');

const tests = [
    require('./self_eval'),
    require('./math'),
    require('./var'),
    require('./blocks'),
    require('./if_cond'),
    require('./built_in_func'),
    require('./user_defined_func'),
    require('./lambda_func'),
    require('./switch'),
    require('./while_loop'),
    require('./for_loop'),
    require('./class'),
    require('./modules'),
    require('./import'),
];

const eva = new Eva();

tests.forEach(test => test(eva));

eva.eval(['print', '"Hello,"', '"World!"']);

console.log("All assertions passed!");
