var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "lodash", "jquery", "system/lang/ioc", "system/text/parser"], function (require, exports, _, $, ioc_1, parser) {
    "use strict";
    var Globalize = require('globalize');
    Date['Formats'] = {
        Unformatted: 'yyyy-MM-dd HH:mm:ss',
        Sortable: 'S',
        LongDate_ShortTime: 'f',
        LongDate_LongTime: 'F',
        ShortTime: 't',
        LongTime: 'T',
        ShortDate: 'd',
        LongDate: 'D',
        Month_Year: 'Y',
        Month_Day: 'M'
    };
    var numberFormatter = function (prefix) { return function (value) { return prefix + (value || ''); }; };
    Number['Formats'] = {
        Number: numberFormatter('n'),
        Decimal: numberFormatter('d'),
        Percent: numberFormatter('p'),
        Currency: numberFormatter('c')
    };
    Number['Formats'].Number_Zero = 'n0';
    Number['Formats'].Number_Two = Number['Formats'].Number(2);
    Number['Formats'].Number_Four = Number['Formats'].Number(4);
    Number['Formats'].Decimal_Zero = 'd0';
    Number['Formats'].Decimal_Two = Number['Formats'].Decimal(2);
    Number['Formats'].Decimal_Four = Number['Formats'].Decimal(4);
    Number['Formats'].Percent_Zero = 'p0';
    Number['Formats'].Percent_One = Number['Formats'].Percent(1);
    Number['Formats'].Percent_Two = Number['Formats'].Percent(2);
    Number['Formats'].Currency_Zero = 'c0';
    Number['Formats'].Currency_Two = Number['Formats'].Currency(2);
    var Formatter = (function () {
        function Formatter() {
            this.culture = 'en';
        }
        Formatter.prototype.setCulture = function (culture) {
            this.culture = culture;
            Globalize.culture(culture);
        };
        Formatter.prototype.cultureInfo = function () {
            return Globalize.culture();
        };
        Formatter.prototype.format = function (value, format, culture) {
            var _this = this;
            var removeThousandsSeparators = false, exponent = null;
            culture = culture || this.culture;
            //  if format is an array, recursively call format on the value for each format in the array and
            //  concatenate the results together to make one string of all the formatted values where each
            //  value is separated by a space.
            if (_.isArray(format)) {
                return _.map(format, function (f) { return _this.format(value, f, culture); }).join(' ');
            }
            //  format is not an array, so format the value
            format = format;
            if (value instanceof Date) {
                return formatDate(value, format, culture);
            }
            else {
                if (format && format.match(/^[ndmg]e?[0-9]*/i) !== null && !(value instanceof Date)) {
                    var number = (typeof value === 'number') ? value : parser.parseFloat(value, 10, culture);
                    if (isNaN(number) || number === null) {
                        format = undefined;
                    }
                    else {
                        var formatType = format.substr(0, 1);
                        if (format.match(/^[ndmg]e[0-9]*/i) !== null) {
                            //removes optional e param to pass format in as expected constructGlobalizeFormat
                            format = format.replace('e', '');
                            var parts = extractScientificNotationParts(number);
                            if (parts && parts.length > 1) {
                                number = parseFloat(parts[0]);
                                exponent = 'e' + parts[1];
                            }
                        }
                        value = number;
                        switch (formatType) {
                            case 'm':
                                //  get the format to be used by the globalize.format method below.
                                format = constructGlobalizeFormat(number, format);
                                break;
                            case 'g':
                                //  get the format to be used by the globalize.format method below.
                                format = constructGlobalizeFormat(number, format);
                                removeThousandsSeparators = true;
                                break;
                            default:
                                break;
                        }
                    }
                }
                var formattedValue = Globalize.format(value, format, culture);
                if (exponent) {
                    formattedValue += exponent;
                }
                if (removeThousandsSeparators) {
                    var regex = new RegExp(Globalize.culture(culture).numberFormat[','].replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'), 'g');
                    if (formattedValue) {
                        formattedValue = formattedValue.replace(regex, '');
                    }
                }
                return formattedValue;
            }
        };
        // A method to abbreviate the given string into abc...xyz. The number of visible characters will be provided as
        // the second argument.
        Formatter.prototype.abbreviate = function (str, abbrLength) {
            if (!str) {
                return str;
            }
            if (str.length > (abbrLength * 2)) {
                return str.substr(0, abbrLength) + '...' + str.substr(str.length - abbrLength, str.length);
            }
            return str;
        };
        ;
        //A method to abbreviate a string based on its container width.
        Formatter.prototype.abbreviateByWidth = function (str, containerWidth, abbrLength) {
            if (!str) {
                return str;
            }
            var dummySpan = document.createElement('span');
            dummySpan.className = 'dummy-span';
            dummySpan.innerHTML = str;
            var body = $(document).find('body');
            body.append(dummySpan);
            var dummySpanWidth = $(dummySpan).width(); //Width of the string in the DOM
            $(dummySpan).remove();
            if (dummySpanWidth > containerWidth) {
                return this.abbreviate(str, abbrLength);
            }
            return str;
        };
        ;
        return Formatter;
    }());
    Formatter = __decorate([
        ioc_1.singleton
    ], Formatter);
    function formatDate(value, format, culture) {
        format = convertMissingDateFormat(format);
        return Globalize.format(value, format, culture);
    }
    function convertMissingDateFormat(format) {
        /*tslint:disable:quotemark */
        var RFC1123 = "ddd, dd MMM yyyy HH':'mm':'ss 'GMT'";
        /*tslint:enable:quotemark */
        if (format === 'g') {
            return getGeneralDateShortTimeFormat();
        }
        else if (format === 'G' || format === 'GT') {
            return getGeneralDateLongTimeFormat();
        }
        else if (format === 'r' || format === 'R') {
            return RFC1123;
        }
        else if (format === 's' || format === 'm' || format === 'y') {
            return format.toUpperCase();
        }
        else {
            return format;
        }
    }
    function getGeneralDateShortTimeFormat() {
        return getCalendarPattern('d') + ' ' + getCalendarPattern('t');
    }
    function getCalendarPattern(pattern) {
        var calendar = Globalize.culture().calendar, patterns = calendar.patterns;
        return patterns[pattern];
    }
    function getGeneralDateLongTimeFormat() {
        return getCalendarPattern('d') + ' ' + getCalendarPattern('T');
    }
    function extractScientificNotationParts(value) {
        value = value;
        if (useNormalNotation(value)) {
            return [value.toString()];
        }
        return value.toExponential().split(/[eE]/);
    }
    function useNormalNotation(value) {
        if (value === 0) {
            return true;
        }
        var NON_SCI_MAX = 10000000000;
        var NON_SCI_MIN = 0.000001;
        var absValue = Math.abs(value);
        return absValue < NON_SCI_MAX && absValue > NON_SCI_MIN;
    }
    //  Maps the custom format to a native Globalize format.
    function constructGlobalizeFormat(number, format) {
        var precisionString = format.substr(1);
        var precision = precisionString.length > 0 ? parseInt(precisionString, 10) : undefined;
        var formattedValue = formatToMaxPrecision(number, precision);
        return getMaxPrecisionFormat(formattedValue);
    }
    //  Gets the format to pass into the globalize format method.
    function getMaxPrecisionFormat(stringValue) {
        var decimalPosition = stringValue.indexOf('.');
        var actualPrecision = (decimalPosition > -1) ? ((stringValue.length - 1) - decimalPosition) : 0;
        return 'n' + actualPrecision;
    }
    //  Gets the format for a number to a maximum precision after the decimal point.  If a number
    //  has digits that are rounded off past the precision boundary, trailing zeros
    //  will be kept, otherwise they will be dropped.
    function formatToMaxPrecision(value, precision) {
        var number = Number(value);
        if (isNaN(number)) {
            return value;
        }
        var decimalValue;
        var parts = extractScientificNotationParts(number);
        if (Math.abs(number) < 1 && parts && parts.length > 1) {
            var whole = Math.floor(parseFloat(parts[0])).toString().length;
            var dec = parts[0].toString().length > whole ? (parts[0].toString().length - whole - 1) : 0;
            var diglen = whole + dec;
            var exp = Math.abs(parseFloat(parts[1]));
            var decUpd = exp + (precision > diglen ? diglen : precision) - 1;
            decimalValue = number.toFixed(decUpd > 20 ? 20 : decUpd);
        }
        else if (Math.abs(number) >= 1 || !precision) {
            decimalValue = (precision === 0 || precision) ?
                number.toFixed(precision > 20 ? 20 : precision) : number.toString();
        }
        else {
            decimalValue = number.toPrecision(precision);
        }
        var defaultValue = number.toString();
        return (defaultValue.length < decimalValue.length) ? defaultValue : decimalValue;
    }
    return Formatter;
});
