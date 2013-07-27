
var p = require('q');

var coros = [];

function currentCoro () {
    return coros[coros.length - 1];
}

exports.resume = function () {
    var coro = currentCoro();
    return function (error) {
        var val, err;
        coros.push(coro);
        try {
            val = error ? coro.generator.throw(error) : coro.generator.next(Array.prototype.slice.call(arguments, 1));
        }
        catch (e) {
            err = e;
        }
        coro.handle(err, val);
    };
};

exports.resumeFirst = function () {
    var coro = currentCoro();
    return function (error, res) {
        var val, err;
        coros.push(coro);
        try {
            val = error ? coro.generator.throw(error) : coro.generator.next(res);
        }
        catch (e) {
            err = e;
        }
        coro.handle(err, val);
    };
};

exports.resumeNth = function (n) {
    var coro = currentCoro();
    return function (error) {
        var val, err;
        coros.push(coro);
        try {
            val = error ? coro.generator.throw(error) : coro.generator.next(arguments[n]);
        }
        catch (e) {
            err = e;
        }
        coro.handle(err, val);
    };
};

exports.resumeNoThrow = function () {
    var coro = currentCoro();
    return function () {
        var val, err;
        coros.push(coro);
        try {
            val = coro.generator.next(Array.prototype.slice.call(arguments, 0));
        }
        catch (e) {
            err = e;
        }
        coro.handle(err, val);
    };
};

exports.resumeNoThrowFirst = function () {
    var coro = currentCoro();
    return function (first) {
        var val, err;
        coros.push(coro);
        try {
            val = coro.generator.next(first);
        }
        catch (e) {
            err = e;
        }
        coro.handle(err, val);
    };
};

exports.resumeNoThrowNth = function (n) {
    var coro = currentCoro();
    return function () {
        var val, err;
        coros.push(coro);
        try {
            val = coro.generator.next(arguments[n]);
        }
        catch (e) {
            err = e;
        }
        coro.handle(err, val);
    };
};

exports.resumeThrow = function () {
    var coro = currentCoro();
    return function (error) {
        var val, err;
        coros.push(coro);
        try {
            val = coro.generator.throw(error);
        }
        catch (e) {
            err = e;
        }
        coro.handle(err, val);
    };
};

var Coro = function (generator, deferred, callback) {
    this.generator = generator;
    this.deferred = deferred;
    this.callback = callback;
};

Coro.prototype.handle = function (err, result) {
    coros.pop();
    if (err || result.done) {
        this.handleResult(err, result);
    }
    else if (result.value && result.value.then) {
        this.handlePromise(result.value);
    }
};

Coro.prototype.handleResult = function (err, result) {
    if (this.callback) {
        this.callback.call(null, err || null, result ? result.value : null);
    }
    else if (err) {
        this.deferred.reject(err);
    }
    else {
        this.deferred.resolve(result.value);
    }
};

Coro.prototype.handlePromise = function (promise) {
    var coro = this;
    promise.then(
        function (value) {
            var val, err;
            coros.push(coro);
            try {
                val = coro.generator.next(value);
            }
            catch (e) {
                err = e;
            }
            coro.handle(err, val);
        },
        function (error) {
            var val, err;
            coros.push(coro);
            try {
                val = coro.generator.throw(error);
            }
            catch (e) {
                err = e;
            }
            coro.handle(err, val);
        }
    );
};

exports.run = function (makeGenerator, args, callback) {

    var deferred = callback ? null : p.defer(),
        invocant = this;

    setImmediate(function () {
        var val, err, coro;
        coro = new Coro(makeGenerator.apply(invocant, args), deferred, callback);

        coros.push(coro);
        try {
            val = coro.generator.next();
        }
        catch (e) {
            err = e;
        }
        coro.handle(err, val);
    });

    if (! callback) {
        return deferred.promise;
    }
};


exports.boundRun = function () {
    return exports.run.apply(this, arguments);
};



