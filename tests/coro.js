
var litmus = require('litmus'),
    exec   = require('child_process').exec,
    coro   = require('../lib/coro'),
    p      = require('p-promise');

module.exports = new litmus.Test(module, function () {
    this.plan(18);

    var test = this;

    this.async('run command', function (done) {

        coro.run(function * () {

            test.is((yield exec('printf hello', coro.resume()))[0], 'hello', 'run command once');

            test.is((yield exec('printf hello', coro.resume()))[0], 'hello', 'run command again');

            try {
                yield exec('false', coro.resume());
            }
            catch (e) {
                test.like(e, /Command failed/, 'default resume throws');
            }

            test.is(yield exec('printf hello', coro.resumeFirst()), 'hello', 'resumeFirst returns first non error argument');

            try {
                yield exec('false', coro.resumeFirst());
                test.fail('exception expected');
            }
            catch (e) {
                test.like(e, /Command failed/, 'resumeOne error as exception');
            }

            test.is(yield exec('printf hello', coro.resumeNoThrow()), [null, 'hello', ''], 'resumeNoThrow returns array of results');

            test.like((yield exec('false', coro.resumeNoThrow()))[0], /Command failed/, 'error passed as arg');

            test.like(yield exec('fail', coro.resumeNoThrowFirst()), /Command failed/, 'resumeNoThrowFirst returns first argument');

            test.is(yield exec('printf hello', coro.resumeNoThrowNth(1)), 'hello', 'resumeNoThrowNth(1) returns second argument');

            try {
                yield exec('fail', coro.resumeThrow());
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

            test.is(yield coro.run(function * () {
                return 'hello';
            }, null, coro.resumeFirst()), 'hello', 'return value passed as second argument to callback');

             
            var e;
            test.ok(yield coro.run(function * () {
                throw e = new Error('hello');
            }, null, coro.resumeNoThrowFirst()) === e, 'exception passed as first argument to callback');

            done.resolve();

        });

        this.async('returned promise success', function (done) {

            var returnValue = {};

            coro.run(function * () {
                return returnValue;
            }).then(function (val) {
                test.ok(val === returnValue, 'promise resolved with returned value');
                done.resolve();
            });

        });

        this.async('returned promise success', function (done) {

            var thrownValue = new Error();

            coro.run(function * () {
                throw thrownValue;
            }).then(null, function (val) {
                test.ok(val === thrownValue, 'promise rejected with thrown value');
                done.resolve();
            });

        });

        test.async('invocant and args', function (done) {
            var invocant = {},
                arg1 = {}, arg2 = {};

            coro.run.call(invocant, function * (passedArg1, passedArg2) {
                test.ok(invocant === this, 'invocant to run is invocant to generator function');
                test.ok(arg1 === passedArg1 && arg2 === passedArg2, 'args are those passed to run');
                done.resolve();
            }, [ arg1, arg2 ]);
        });

    });
    
});


