define(function () {
    'use strict';

    function toMethod(name, getter) {
        return function forwardMethod() {
            var object = getter.call(this, this);
            return object[name].apply(object, arguments);
        };
    }

    function getProperty(name, getter) {
        return function forwardGetProperty(self) {
            self = self || this;
            var object = getter.call(self, self);
            return object[name];
        };
    }

    function setProperty(name, getter) {
        return function forwardSetProperty() {
            var self, value, object;
            if (arguments.length > 1) {
                self = arguments[0];
                value = arguments[1];
            } else {
                self = this;
                value = arguments[0];
            }
            object = getter.call(self, self);
            object[name] = value;
        };
    }

    return {
        toMethod: toMethod,
        getProperty: getProperty,
        setProperty: setProperty
    };
});