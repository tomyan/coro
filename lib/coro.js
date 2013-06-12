
exports.run = function (makeGenerator) {
    var coro,
        handle = function (result) {
            if (result.value && result.value.then) {
                result.value.then(
                    function (val) { handle(coro.send(val)); },
                    function (err) { handle(coro.throw(err)); }
                );
            }
        },
        wrapper = {
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
            },
            throw : function (err) {
                handle(coro.throw(err));
            }
        };
    coro = wrapper.generator = makeGenerator(wrapper);
    handle(coro.next());
    return wrapper;
};

