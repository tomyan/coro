
var litmus = require('litmus'),
    exec   = require('child_process').exec,
    run    = require('../lib/coro').run,
    p      = require('p-promise');

module.exports = new litmus.Test(module, function () {
    this.plan(16);

    var test = this;

    this.async('run command', function (done) {

        run(function * (next) {

            test.is((yield exec('printf hello', next.resume))[0], 'hello', 'run command once');
            test.is((yield exec('printf hello', next.resume))[0], 'hello', 'run command again');

            try {
                yield exec('false', next.resume);
            }
            catch (e) {
                test.like(e, /Command failed/, 'default resume throws');
            }

            test.is(yield exec('printf hello', next.resumeFirst), 'hello', 'resumeOne returns first non error argument');

            try {
                yield exec('false', next.resumeFirst);
                test.fail('exception expected');
            }
            catch (e) {
                test.like(e, /Command failed/, 'resumeOne error as exception');
            }

            test.is(yield exec('printf hello', next.resumeNoThrow), [null, 'hello', ''], 'resumeNoThrow returns array of results');

            test.like((yield exec('false', next.resumeNoThrow))[0], /Command failed/, 'error passed as arg');

            test.like(yield exec('fail', next.resumeNoThrowFirst), /Command failed/, 'resumeNoThrowFirst returns first argument');

            test.is(yield exec('printf hello', next.resumeNoThrowNth(1)), 'hello', 'resumeNoThrowNth(1) returns second argument');

            try {
                yield exec('fail', next.resumeThrow);
                test.fail('exception expected');
            }
            catch (e) {
                test.like(e.message, /Command failed/, 'resumeThrow throws first argument');
            }

            var successfulDeferred = p.defer(),
                resolvedValue = {};

            process.nextTick(function () {
                successfulDeferred.resolve(resolvedValue);
            });

            test.ok((yield successfulDeferred.promise) === resolvedValue, 'resolved value is yielded');

            var unsuccessfulDeferred = p.defer(),
                error = new Error('an error');

            process.nextTick(function () {
                unsuccessfulDeferred.reject(error);
            });

            try {
                yield unsuccessfulDeferred.promise;
                test.fail('exception expected');
            }
            catch (e) {
                test.ok(e === error, 'rejected promise throws rejected value');
            }

            test.is(yield run(function * (next) {
                return 'hello';
            }, next.resumeFirst), 'hello', 'return value passed as second argument to callback');

             
           var e;
            test.ok(yield run(function * (next) {
                throw e = new Error('hello');
            }, next.resumeNoThrowFirst) === e, 'exception passed as first argument to callback');

            done.resolve();

        });

        this.async('returned promise success', function (done) {

            var returnValue = {};

            run(function * () {
                return returnValue;
            }).then(function (val) {
                test.ok(val === returnValue, 'promise resolved with returned value');
                done.resolve();
            });

        });

        this.async('returned promise success', function (done) {

            var thrownValue = new Error();

            run(function * () {
                throw thrownValue;
            }).then(null, function (val) {
                test.ok(val === thrownValue, 'promise rejected with thrown value');
                done.resolve();
            });

        });

    });
    
});


