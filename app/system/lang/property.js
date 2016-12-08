define(function (require) {
    'use strict';

    var SCOPE = '__private__';

    function readOnly(object, propertyName, initialValue) {
        initScope(object);
        set(object, propertyName, initialValue);
        Object.defineProperty(object, propertyName, { get: getter(object, propertyName) });
    }

    function writeOnly(object, propertyName, initialValue) {
        initScope(object);
        set(object, propertyName, initialValue);
        Object.defineProperty(object, propertyName, { set: setter(object, propertyName) });
    }

    function readWrite(object, propertyName, initialValue) {
        initScope(object);
        set(object, propertyName, initialValue);
        Object.defineProperty(object, propertyName, {
            get: getter(object, propertyName),
            set: setter(object, propertyName)
        });
    }

    function initScope(context) {
        if (!context[SCOPE]) {
            context[SCOPE] = {};
        }
    }

    function get(object, propertyName) {
        return object[SCOPE][propertyName];
    }

    function set(object, propertyName, propertyValue) {
        object[SCOPE][propertyName] = propertyValue;
        return object;
    }

    function getter(object, propertyName) {
        return get.bind(null, object, propertyName);
    }

    function setter(object, propertyName) {
        return set.bind(null, object, propertyName);
    }

    return {
        readOnly: readOnly,
        writeOnly: writeOnly,
        readWrite: readWrite,
        set: set,
        get: get
    };
});