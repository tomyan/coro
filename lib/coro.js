
exports.run = function (makeGenerator) {

    var coro;

    function handle (result) {
        if (result.value && result.value.then) {
            result.value.then(
                function (val) { handle(coro.send(val)); },
                function (err) { handle(coro.throw(err)); }
            );
        }
    }

    var next = {
        resume : function (err) {
            handle(err ? coro.throw(err) : coro.send(Array.prototype.slice.call(arguments, 1)));
        },
        resumeFirst : function (err, res) {
            handle(err ? coro.throw(err) : coro.send(res));
        },
        resumeNth : function (n) {
            return function (err) {
                handle(err ? coro.throw(err) : coro.send(arguments[n]));
            };
        },
        resumeNoThrow : function () {
            handle(coro.send(Array.prototype.slice.call(arguments, 0)));
        }
    };

    coro = next.coro = makeGenerator(next);

    handle(coro.next());

    return coro;
};

