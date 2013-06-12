
var exec = require('child_process').exec,
    run  = require('../lib/coro').run;

run(function * (coro) {

    console.log(yield exec('printf hello', coro.resumeFirst));

});


