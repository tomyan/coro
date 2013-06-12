
var exec = require('child_process').exec,
    run  = require('../lib/coro').run;

run(function * (next) {

    console.log(yield exec('printf hello', next.resumeFirst));

});


