
exports.async = function async (i) {
    var coro,
        wrapper = {
            resume : function () {
                coro.send(Array.prototype.slice.call(arguments, 0));
            },
            'throw' : function (err) {
                coro.throw(err);
            }
        };
    coro = wrapper.generator = i(wrapper);
    coro.next();
    return wrapper;
};

