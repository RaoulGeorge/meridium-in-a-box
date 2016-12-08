/// <amd-dependency path="globalize" />
define(["require", "exports", "globalize"], function (require, exports) {
    "use strict";
    var Globalize = require('globalize');
    var Parser = (function () {
        function Parser() {
        }
        Parser.prototype.parseInt = function (value, radix, culture) {
            if (value === undefined || value === null) {
                return value;
            }
            if (typeof value !== 'string' && typeof value !== 'number') {
                return NaN;
            }
            return Globalize.parseInt(value, radix, culture);
        };
        ;
        Parser.prototype.parseFloat = function (value, radix, culture) {
            if (value === undefined || value === null || typeof value === 'number') {
                return value;
            }
            if (typeof value !== 'string') {
                return NaN;
            }
            return Globalize.parseFloat(value, radix, culture);
        };
        ;
        Parser.prototype.parseDate = function (value, formats, culture) {
            return Globalize.parseDate(value, formats, culture);
        };
        ;
        return Parser;
    }());
    return new Parser();
});
