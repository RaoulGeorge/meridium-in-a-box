define(function () {
    'use strict';

    String.prototype.toStaticHTML = function () {
        if (window.toStaticHTML) {
            return window.toStaticHTML(this).trim();
        } else {
            return this.trim();
        }
    };

    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    String.prototype.startsWith = function (string, ignoreCase) {
        if (ignoreCase === undefined) {
            ignoreCase = true;
        }
        var val = ignoreCase ? string.toLowerCase() : string;
        var valLen = string.length;
        var thisVal = ignoreCase ? this.toLowerCase() : this;

        if (thisVal.substr(0, valLen) === val) {
            return true;
        }
        return false;
    };

    String.prototype.format = function () {
        var args = arguments,
            rx1 = /\{(\d|\d\d)\}/g,
            rx2 = /\d+/;
        return this.replace(rx1, function ($0) {
            var idx = 1 * $0.match(rx2)[0];
            return args[idx] !== undefined ? args[idx] : (args[idx] === '' ? '' : $0);
        });
    };

    String.isNullOrWhitespace = function (string) {
        if (string === undefined || string === null) {
            return true;
        }

        if (typeof string !== 'string') {
            string = string.toString();
        }

        return string.trim() === '';
    };

    String.compare = function(str1, str2) {
        if (str1 === undefined || str1 === null ||
            str2 === undefined || str2 === null) {
            return false;
        }

        return str1.toLocaleLowerCase().localeCompare(str2.toLocaleLowerCase());
    };

    /**
    * Escapes a given string to be used in a regex
    * @param {string} s - String to escape
    * @returns {string} - 's' with all regex special characters escaped.
    */
    String.escapeRegex = function(s) {
        return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
            replace(/\x08/g, '\\x08');
    };
});