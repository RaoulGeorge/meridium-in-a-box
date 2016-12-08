define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash');

    /*
     * From allong.ex (https://github.com/raganwald/allong.es)
     */
    function classDecorator (decoration) {
        return function (clazz) {
            function Decorated  () {
                var self = this instanceof Decorated ? this : new Decorated();

                return clazz.apply(self, arguments);
            }
            Decorated.prototype = _.extend(new clazz(), decoration);
            return Decorated;
        };
    }

    return classDecorator;
});