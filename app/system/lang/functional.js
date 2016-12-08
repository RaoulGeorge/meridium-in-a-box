define(function (require) {
    'use strict';

    var R = require('ramda');

    function noop() {
        // do nothing
    }

    function result(name, obj) {
        if (R.is(Function, obj[name])) {
            return obj[name]();
        } else {
            return obj[name];
        }
    }

    function toConsole(method, value) {
        console[method](value);
        return value;
    }

    function debug(x) {
        debugger;   // jshint ignore:line
        return x;
    }

    function str() {
        return Array.prototype.join.call(arguments, '');
    }

    var defaultToObject = R.either(R.identity, function () { return {}; });

    var defaultToArray = R.either(R.identity, function () { return []; });

    return {
        noop: noop,
        identity: R.identity,
        areSame: R.identical,
        result: R.curry(result),
        log: toConsole.bind(null, 'log'),
        trace: toConsole.bind(null, 'trace'),
        warn: toConsole.bind(null, 'warn'),
        error: toConsole.bind(null, 'error'),
        debug: debug,
        str: str,
        defaultToObject: defaultToObject,
        defaultToArray: defaultToArray
    };
});