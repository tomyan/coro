
var p = require('p-promise');

exports.run = function (makeGenerator, callback) {

    var generator, deferred = callback ? null : p.defer();

    function handle (err, result) {
        if (err || result.done) {
            if (callback) {
                callback(err || null, result ? result.value : null);
            }
            else if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(result.value);
            }
        }
        else if (result.value && result.value.then) {
            result.value.then(
                function (value) {
                    var val, err;
                    try {
                        val = generator.send(value);
                    }
                    catch (e) {
                        err = e;
                    }
                    handle(err, val);
                },
                function (error) {
                    var val, err;
                    try {
                        val = generator.throw(error);
                    }
                    catch (e) {
                        err = e;
                    }
                    handle(err, val);
                }
            );
        }
    }

    var next = {
        resume : function (error) {
            var val, err;
            try {
                val = error ? generator.throw(error) : generator.send(Array.prototype.slice.call(arguments, 1));
            }
            catch (e) {
                err = e;
            }
            handle(err, val);
        },
        resumeFirst : function (error, res) {
            var val, err;
            try {
                val = error ? generator.throw(error) : generator.send(res);
            }
            catch (e) {
                err = e;
            }
            handle(err, val);
        },
        resumeNth : function (n) {
            return function (error) {
                var val, err;
                try {
                    val = error ? generator.throw(error) : generator.send(arguments[n]);
                }
                catch (e) {
                    err = e;
                }
                handle(err, val);
            };
        },
        resumeNoThrow : function () {
            var val, err;
            try {
                val = generator.send(Array.prototype.slice.call(arguments, 0));
            }
            catch (e) {
                err = e;
            }
            handle(err, val);
        },
        resumeNoThrowFirst : function (first) {
            var val, err;
            try {
                val = generator.send(first);
            }
            catch (e) {
                err = e;
            }
            handle(err, val);
        },
        resumeNoThrowNth : function (n) {
            return function () {
                var val, err;
                try {
                    val = generator.send(arguments[n]);
                }
                catch (e) {
                    err = e;
                }
                handle(err, val);
            };
        },
        resumeThrow : function (error) {
            var val, err;
            try {
                val = generator.throw(error);
            }
            catch (e) {
                err = e;
            }
            handle(err, val);
        }
    };

    setImmediate(function () {
        var val, err;
        generator = makeGenerator(next);
        try {
            val = generator.next();
        }
        catch (e) {
            err = e;
        }
        handle(err, val);
    });

    if (! callback) {
        return deferred.promise;
    }
};

