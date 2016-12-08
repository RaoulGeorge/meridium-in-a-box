define(function () {
    'use strict';

    var _ = require('lodash');

    function Interface(name, methods, properties) {
        this.name = name;
        this.methods = methods || [];
        this.properties = properties || [];
    }

    Interface.prototype.implementedBy = function (object) {
        verifyMethods(this, object);
        verifyProperties(this, object);
    };

    function verifyMethods(self, object) {
        var i, method;
        for (i = 0; i < self.methods.length; i++) {
            method = self.methods[i];
            if (_.isUndefined(object[method])) {
                throw 'Missing method ' + method;
            }

            if (!_.isFunction(object[method])) {
                throw method + ' is not a function';
            }
        }
        return true;
    }

    function verifyProperties(self, object) {
        var i, property;
        for (i = 0; i < self.properties.length; i++) {
            property = self.properties[i];
            if (_.isUndefined(object[property])) {
                throw 'Missing property ' + property;
            }
        }
        return true;
    }

    return Interface;
});