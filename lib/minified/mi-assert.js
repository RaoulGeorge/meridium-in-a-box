define(function defineMiAssert() {
    'use strict';

    function AssertionError(message) {
        this.name = 'AssertionError';
        this.message = message || '';
    }

    function doNothing() {
        // do nothing
    }

    return {
        enabled: false,
        AssertionError: AssertionError,
        assert: doNothing,
        ok: doNothing,
        notOk: doNothing,
        isNull: doNothing,
        isNotNull: doNothing,
        isUndefined: doNothing,
        isNotUndefined: doNothing,
        isFunction: doNothing,
        isObject: doNothing,
        isArray: doNothing,
        isString: doNothing,
        isNumber: doNothing,
        isBoolean: doNothing,
        instanceOf: doNothing,
        isDeferred: doNothing,
        stringNotEmpty: doNothing,
        implementsInterface: doNothing,
        assertInterface: doNothing
    };
});