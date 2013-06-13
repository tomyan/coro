
exports.run = function (makeGenerator) {

    var generator;

    function handle (result) {
        if (result.value && result.value.then) {
            result.value.then(
                function (val) { handle(generator.send(val)); },
                function (err) { handle(generator.throw(err)); }
            );
        }
    }

    var next = {
        resume : function (err) {
            handle(err ? generator.throw(err) : generator.send(Array.prototype.slice.call(arguments, 1)));
        },
        resumeFirst : function (err, res) {
            handle(err ? generator.throw(err) : generator.send(res));
        },
        resumeNth : function (n) {
            return function (err) {
                handle(err ? generator.throw(err) : generator.send(arguments[n]));
            };
        },
        resumeNoThrow : function () {
            handle(generator.send(Array.prototype.slice.call(arguments, 0)));
        },
        resumeNoThrowFirst : function (first) {
            handle(generator.send(first));
        },
        resumeNoThrowNth : function (n) {
            return function () {
                handle(generator.send(arguments[n]));
            };
        },
        resumeThrow : function (err) {
            handle(generator.throw(err));
        }
    };

    process.nextTick(function () {
        generator = makeGenerator(next);
        handle(generator.next());
    });

};

