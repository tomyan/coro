Library for managing Coroutines using Harmony generators. Supports both Node core style callbacks and promises.

Installation
============

Coro can be installed from NPM with the following:

    npm install coro

To make use of the module you (currently) need to run at least 0.11.2 of Node with the --harmony flag.

Status
======

The Coro API is considered stable for use in Node (YMMV in a browser). I'm planning to make it 1.0.0 when you no longer need to pass a flag to node to make it work.

Please note that the API did change between 0.4.3 and 0.5.0 (against expectation) to support setting the invocant and arguments of the generator function in a conveninet way. The change is that all resume functions are on the global coro object and should be called immediately to get a callback to pass to an asynchronous API.

Usage
=====

Run a coroutine as follows:

    var coro = require('coro');
    
    coro.run(function * () {
        
        // Coroutine goodness here
        
    }).done();

coro.run(generator, args, callback) takes the following arguments:

* A generator function containing the code to be run as the coroutine.
* An optional array of arguments that should be passed to the generator function.
* An optional callback function that should be called when the generator has completed. This follows the node convention of passing an error as the first parameter, which is present if an uncaught exception was thrown in the generator function. The second parameter to the callback is the return value from the generator function.

If no callback is passed, then a Promises A+ compatible promise is returned from coro.run().

Within the passed generator function, asynchronous APIs can be accessed synchronously. Two common patterns of asynchronous APIs are currently supported: ones that take a callback and ones that return a promise.

Promise base APIs
-----------------

Coro makes it really easy to use a promise based API and access the resolved value synchronously. Just yield the promise returning function and you'll have the value (or an exception if the promise was rejected):

    var coro = require('coro'),
        read = require('q-io/fs').read;
    
    coro.run(function * () {
        
        try {
            var fileContents = yield read('/some/file', 'r');
        }
        catch (e) {
            // e is the value the promise was rejected wtih 
        }
        
    }).done();

Callback based APIs
-------------------

The convention for asynchronous APIs in Node.js itself is for functions to take a callback argument. This callback is then invoked with an error as the first parameter. The following examples use the "exec" method from the child_process module, which runs a command. The callback passed to exec is invoked with an error (or null), the output of the command to STDOUT, and the output of the command to STDERR.

### coro.resume()

coro.resume() returns a function that will resume the current coroutine where it has been yielded. This function should be passed as the callback parameter to a to a callback based API. If the error parameter is set, then this is raised as an exception. Otherwise, the remaining parameters to the callback are returned from the call to yield in an array.

    var coro = require('coro'),
        exec = require('child_process').exec;
    
    coro.run(function * () {
        
        try {
            var output = yield exec('echo -n hello', coro.resume());
            console.log('STDOUT: ' + output[0] + ', STDERR: ' + output[1]);
        }
        catch (e) {
            console.log('uh oh: ' + e.message);
        }

    }).done();

### coro.resumeFirst()

If you're only interested in the first parameter (e.g. the output to STDOUT for exec), use coro.resumeFirst():

    var coro = require('coro'),
        exec = require('child_process').exec;
    
    coro.run(function * () {
        
        console.log('hello == ' + yield exec('echo -n hello', coro.resumeFirst()));
        
        // still throws on error
        
    }).done();

### coro.resumeNth(n)

The more general case of the above is coro.resumeNth(n). This allows you to pick out any single parameter rather than just the first. For example, to capture the output to STDERR only for exec:

    var coro = require('coro'),
        exec = require('child_process').exec;
    
    coro.run(function * () {
        
        // in this case an empty string will be yielded
        console.log('STDERR: ' + yield exec('echo -n hello', coro.resumeNth(1)));
        
        // still throws on error
        
    }).done();

### coro.resumeNoThrow()

The careful observer will notice that there's a problem with the above methods. Where there is an error (e.g. the command exits with a non-zero exit status) and an exception is thrown, there's no way to access the other parameters to the callback (e.g. the output to STDERR). Where you need this, you can use the coro.resumeNoThrow() function:

    var coro = require('coro'),
        exec = require('child_process').exec;
    
    coro.run(function * () {
        
        // destructuring assignment will be great for this
        var result = yield exec('echo -n hello', coro.resumeNoThrow()),
            err = result[0], stdout = result[1], stderr = result[2];
        
        // still throws on error
        
    }).done();

This is also useful for callback APIs that don't follow Node's conventions for indicating an error in the first parameter.

### coro.resumeNoThrowFirst(), coro.resumeNoThrowNth(n)

These allow you to pick out individual parameters to the callback, rather than have yield return an array of parameters.

### coro.resumeThrow()

Some styles of callback API have a separate callback just for signalling errors (so called "errbacks"). For these use coro.resumeThrow(). In this example we're using the read method from the q-io/fs NPM module to read in a file:

    var coro = require('coro'),
        read = require('q-io/fs').read;
    
    coro.run(function * () {
        
        try {
            var fileContents = yield read('/some/file', 'r').then(
                coro.resumeNoThrowFirst(),
                coro.resumeThrow()
            );
        }
        catch (e) {
            // e is the parameter to the errback if there is an error
        }
        
    }).done();

Using this method for handling promises isn't recommended - use the built in promise support described above.

Tracking completion/errors from your coroutine
----------------------------------------------

There are two ways to track when your coroutine completes (i.e. returns) or throws an error - providing a callback and using a returned promise. These mechanisms make it trivial to compose coroutines by having one wait for the completion of another.

### Passing a callback

You can pass a callback function as a third parameter to the run function. This follows the convention of taking an error as the first parameter (or null if successful), followed by the return value (or null if an exception is raised):

    var coro = require('coro'),
        exec = require('child_process').exec;
    
    coro.run(function * () {
        
        return yield exec('echo -n hello', coro.resumeFirst());
        
    }, function (err, output) {
        if (err) {
            // deal with error
        }
        else {
            // deal with output
        }
    });

### Returned promise

If a callback is not passed, a Promises A+ compatible promise is returned from the run function. This is either resolved with the return value or rejected with an exception:

    var coro = require('coro'),
        exec = require('child_process').exec;
    
    coro.run(function * () {
        
        return yield exec('echo -n hello', coro.resumeFirst());
        
    }).then(function (output) {
        // deal with output
    }, function (err) {
        // deal with errors
    }).done();


coro.boundRun() method
======================

If you'd like to maintain the value of `this` inside a coroutine without having to call `call` or `apply` on the run method, then you can add a run method to your own object using the coro.boundRun method:

    var coro = require('coro');
    
    var MyThing = function () {};
    
    MyThing.prototype.run = coro.boundRun;
    
    MyThing.prototype.doSomething = function () {
        
        this.run(function * () {
            // this is the instance of my thing
        }).done();
        
    };

This is convenient as it allow coroutines to arbtrarily nested while maintaining the value of `this`.

License
=======

The MIT License (MIT)

Copyright (C) 2013 by <a href="https://github.com/tomyan/coro/commits/master">the project's contributors</a>.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


