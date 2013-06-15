Library for managing Coroutines using Harmony generators. Supports both Node core style callbacks and promises.

Installation
============

Coro can be installed from NPM with the following:

    npm install coro

To make use of the module you (currently) need to run at least 0.11.2 of Node with the --harmony flag.

Usage
=====

Run a coroutine as follows:

    var run = require('coro').run;
    
    run(function * (next) {
        
        // Coroutine goodness here
        
    });

Within the passed generator function, asynchronous APIs can be accessed synchronously. Two common patterns of asynchronous APIs are currently supported: ones that take a callback and ones that return a promise.


Callback based APIs
-------------------

The convention for asynchronous APIs in Node.js itself is for functions to take a callback argument. This callback is then invoked with an error as the first parameter. The following examples use the "exec" method from the child_process module, which runs a command. The callback passed to exec is invoked with an error (or null), the output of the command to STDOUT, and the output of the command to STDERR.

### next.resume

Calling yield with the next.resume function results in an array of the non-error arguments (i.e. output to STDOUT and STDERR for exec) on success, or an exception if there was an error:

    
    var run  = require('coro').run,
        exec = require('child_process').exec;
    
    run(function * (next) {
        
        try {
            var output = yield exec('echo -n hello', next.resume);
            console.log('STDOUT: ' + output[0] + ', STDERR: ' + output[1]);
        }
        catch (e) {
            console.log('uh oh: ' + e.message);
        }

    });

### next.resumeFirst

If you're only interested in the first parameter (e.g. the output to STDOUT for exec), use next.resumeFirst:

    var run  = require('coro').run,
        exec = require('child_process').exec;
    
    run(function * (next) {
        
        console.log('hello == ' + yield exec('echo -n hello', next.resumeFirst));
        
        // still throws on error
        
    });

### next.resumeNth

The more general case of the above is next.resumeNth. This allows you to pick out any single parameter rather than just the first. For example, to capture the output to STDERR only for exec:

    var run  = require('coro').run,
        exec = require('child_process').exec;
    
    run(function * (next) {
        
        // in this case an empty string will be yielded
        console.log('STDERR: ' + yield exec('echo -n hello', next.resumeNth(1)));
        
        // still throws on error
        
    });

### next.resumeNoThrow

The careful observer will notice that there's a problem with the above methods. Where there is an error (e.g. the command exits with a non-zero exit status) and an exception is thrown, there's no way to access the other parameters to the callback (e.g. the output to STDERR). Where you need this, you can use the next.resumeNoThrow function:

    var run  = require('coro').run,
        exec = require('child_process').exec;
    
    run(function * (next) {
        
        // destructuring assignment will be great for this
        var result = yield exec('echo -n hello', next.resumeNoThrow),
            err = result[0], stdout = result[1], stderr = result[2];
        
        // still throws on error
        
    });

This is also useful for callback APIs that don't follow Node's conventions for indicating an error in the first parameter.

### next.resumeNoThrowFirst, next.resumeNoThrowNth

These allow you to pick out individual parameters to the callback, rather than have yield return an array of parameters.

### next.resumeThrow

Some styles of callback API have a separate callback just for signalling errors (so called "errbacks"). For these use next.resumeThrow. In this example we're using the read method from the q-io/fs NPM module to read in a file:

    var run  = require('coro').run,
        read = require('q-io/fs').read;
    
    run(function * (next) {
        
        try {
            var fileContents = yield read('/some/file', 'r').then(
                next.resumeNoThrowFirst,
                next.resumeThrow
            );
        }
        catch (e) {
            // e is the parameter to the errback if there is an error
        }
        
    });

### Integration with promises

While it is possible to make use of promises as in the example above, it's not neccessary as support for promises is built in. The above example can be rewritten as:

    var run  = require('coro').run,
        read = require('q-io/fs').read;
    
    run(function * (next) {
        
        try {
            var fileContents = yield read('/some/file', 'r');
        }
        catch (e) {
            // e is the value the promise was rejected wtih 
        }
        
    });

### Tracking completion/errors from your coroutine

There are two ways to track when your coroutine completes (i.e. returns) or throws an error - providing a callback and using a returned promise. These mechanisms make it trivial to compose coroutines by having one wait for the completion of another.

#### Passing a callback

You can pass a callback function as a second parameter to the run function. This follows the convention of taking an error as the first parameter (or null if successful), followed by the return value (or null if an exception is raised):

    var run  = require('coro').run,
        exec = require('child_process').exec;
    
    run(function * (next) {
        
        return yield exec('echo -n hello', next.resumeFirst);
        
    }, function (err, output) {
        if (err) {
            // deal with error
        }
        else {
            // deal with output
        }
    });

#### Returned promise

If a callback is not passed, a Promises A+ compatible promise is returned from the run function. This is either resolved with the return value or rejected with an exception:

    var run  = require('coro').run,
        exec = require('child_process').exec;
    
    run(function * (next) {
        
        return yield exec('echo -n hello', next.resumeFirst);
        
    }).then(function (output) {
        // deal with output
    }, function (err) {
        // deal with errors
    });



License
=======

The MIT License (MIT)

Copyright (C) 2013 by <a href="https://github.com/tomyan/coro/commits/master">the project's contributors</a>.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


