define(function () {
    'use strict';

    function CultureList(culture) {
        this.cultures = buildList(culture);
    }

    CultureList.prototype.next = function () {
        return this.cultures.shift();
    };

    function buildList(culture) {
        if (!culture) { return ['']; }
        if (culture === 'en') { return [culture]; }
        if (culture.indexOf('-') !== -1) {
            return [culture, culture.split('-')[0], 'en'];
        } else {
            return [culture, 'en'];
        }
    }

    return CultureList;
});