
var exec  = require('child_process').exec,
    async = require('../lib/coro').async;

async(function * (coro) {

    var res = yield exec('printf hello', coro.resume);
    console.log(res[1]);

});


