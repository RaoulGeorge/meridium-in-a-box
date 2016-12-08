define(function() {
    'use strict';

    function ctor(name, type, instance) {
        if (instance.constructor === type) {
            throw new Error(name + ' is abstract, it must be inherited from');
        }
    }

    function method(name) {
        return function () {
            throw new Error(name + ' is abstract, it must be overridden');
        };
    }

    return {
        ctor: ctor,
        method: method
    };
});