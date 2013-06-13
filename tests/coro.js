
var litmus = require('litmus'),
    exec   = require('child_process').exec,
    run    = require('../lib/coro').run;

var Promise = function () {
    this._callbacks = [];
    this._errbacks = [];
    this.then = function (callback, errback) {
        if (this._resolved) {
            callback(this._value);
        }
        else if (this._errored) {
            errback(this._value);
        }
        else {
            this._callbacks.push(callback);
            if (errback) {
                this._errbacks.push(errback);
            }
        }
    };
    this.resolve = function (value) {
        this._resolved = true;
        this._value = value;
        while (this._callbacks.length) {
            this._callbacks.shift()(value);
        }
    };
    this.reject = function (value) {
        this._errored = true;
        this._value = value;
        while (this._errbacks.length) {
            this._errbacks.shift()(value);
        }
    };
};

module.exports = new litmus.Test(module, function () {
    this.plan(12);

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

            var successfulPromise = new Promise(),
                resolvedValue = {};

            process.nextTick(function () {
                successfulPromise.resolve(resolvedValue);
            });

            test.ok((yield successfulPromise) === resolvedValue, 'resolved value is yielded');

            var unsuccessfulPromise = new Promise(),
                error = new Error('an error');

            process.nextTick(function () {
                unsuccessfulPromise.reject(error);
            });

            try {
                yield unsuccessfulPromise;
                test.fail('exception expected');
            }
            catch (e) {
                test.ok(e === error, 'rejected promise throws rejected value');
            }

            done.resolve();

        });

    });
    
});


