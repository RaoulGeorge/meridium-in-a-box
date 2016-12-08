define(function (require) {
    "use strict";

    var _ = require("lodash");

    var m = require('mithril');

    function iif(predicate, truthy, falsy) {
        predicate = value(predicate);
        if (predicate) {
            return _.isFunction(truthy) ? truthy() : truthy;
        } else if (falsy) {
            return _.isFunction(falsy) ? falsy() : falsy;
        }
    }

    function exists(object, truthy, falsy) {
        object = value(object);
        if (object) {
            return truthy(object);
        } else if (falsy) {
            return falsy();
        }
    }

    function map(collection, callback, empty) {
        collection = value(collection);
        if (_.size(collection)) {
            return _.map(collection, callback);
        } else if (empty) {
            return empty();
        }
    }

    function value(property) {
        return _.isFunction(property) ? property() : property;
    }

    function restartComputation() {
        m.endComputation();
        m.startComputation();
    }

    function event(currentTarget, args) {
        return {
            currentTarget: currentTarget,
            args: args
        };
    }

    return {
        iif: iif,
        exists: exists,
        map: map,
        value: value,
        restartComputation: restartComputation,
        event: event
    };
});