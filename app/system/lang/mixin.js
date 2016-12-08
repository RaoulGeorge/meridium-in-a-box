define(function (require) {
    'use strict';

    var _ = require('lodash'),
        R = require('ramda');

    function create(type) {
        return {
            mixinProperties: R.partial(mixinProperties, [type]),
            mixinMethods: mixin(type.prototype)
        };
    }

    function mixinProperties(type, self) {
        type.call(self);
    }

    /*
     * Adapted from allong.es (https://github.com/raganwald/allong.es)
     */
    function mixin (decoration) {
        return function decorator () {
            if (arguments[0] !== void 0) {
                return decorator.call(arguments[0]);
            }
            else {
                _.extend(this, decoration);
                return this;
            }
        };
    }

    return {
        create: create,
        mixin: mixin
    };
});