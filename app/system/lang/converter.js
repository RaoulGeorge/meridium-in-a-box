define(function (require) {
    'use strict';

    var Parser = require('system/text/parser'),
        Globalize = require('globalize');

    function Converter() {
        //  do nothing
    }

    Converter.prototype.toNullable = function toNullable(value) {
        return value ? value : null;
    };

    Converter.prototype.toObject = function toObject(value, defaultValue) {
        return value ? value : defaultValue;
    };

    Converter.prototype.toString = function toString(value, defaultValue) {
        if (value === undefined || value === null) {
            return (defaultValue !== undefined) ? defaultValue : '';
        }
        return value.toString();
    };

    Converter.prototype.toNullableString = function toNullableString(value) {
        return Converter.prototype.toString(value, null);
    };

    Converter.prototype.toBoolean = function toBoolean(value, trueValue) {
        if (typeof value === 'undefined') {
            return false;
        }

        if (value === trueValue) { return true; }
        return value === true;
    };

    Converter.prototype.toNullableBoolean = function toNullableBoolean(value, trueValue) {
        if (typeof trueValue === 'undefined' && (typeof value === 'undefined' || value === null)) {
            return null;
        }

        if (value === trueValue) { return true; }
        return value === true;
    };

    Converter.prototype.toInteger = function toInteger(value, defaultValue) {
        var intValue = parseInt(value, 10);
        defaultValue = defaultValue || 0;
        if (isNaN(intValue)) {
            return defaultValue;
        } else {
            return intValue;
        }
    };

    Converter.prototype.toFloat = function toFloat(value, defaultValue) {
        var floatValue = parseFloat(value);
        if (arguments.length < 2) {
            defaultValue = 0;
        }

        if (isNaN(floatValue)) {
            return defaultValue;
        } else {
            return floatValue;
        }
    };

    Converter.prototype.toDate = function toDate(value, format, defaultValue) {
        return converter_toDate(value, format, defaultValue);
    };

    Converter.prototype.toNullableDate = function toNullableDate(value, format) {
        return converter_toDate(value, format, null);
    };

    //  Pulled this into a helper function so that it could be called from both prototype methods. This removes the need
    //  for using "this" in either of them in case someone is using the method as a callback without appropriate bindings.
    function converter_toDate(value, format, defaultValue) {
        format = format || 'yyyy-MM-ddTHH:mm:ss.fff';
        defaultValue = Object.defaultValue(defaultValue, null);
        if (value === null || value === undefined) {
            return defaultValue;
        }
        if (value instanceof Date)
        {
            return value;
        }
        return Parser.parseDate(value, format) ||
            Parser.parseDate(value, 'yyyy-MM-ddTHH:mm:ss.fff') ||
            defaultValue;
    }

    Converter.prototype.toDateString = function toDateString(value, format) {
        format = format || 'S';
        return Globalize.format(value, format);
    };

    Converter.prototype.toNullableInteger = function toNullableInteger(value) {
        var intValue = parseFloat(value);

        if (isNaN(intValue)) {
            return null;
        } else {
            return intValue;
        }
    };

    Converter.prototype.toNullableFloat = function toNullableFloat(value) {
        return this.toFloat(value, null);
    };

    return new Converter();
});