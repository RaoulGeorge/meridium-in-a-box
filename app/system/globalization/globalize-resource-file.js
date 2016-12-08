define(function () {
    'use strict';

    function GlobalizeResourceFile(culture) {
        this.culture = culture;
    }

    GlobalizeResourceFile.prototype.name = function () {
        var culture = this.culture || 'en';
        return 'globalize.culture.' + culture + '.js';
    };

    GlobalizeResourceFile.prototype.url = function (path) {
        return path + '/' + this.name();
    };

    return GlobalizeResourceFile;
});