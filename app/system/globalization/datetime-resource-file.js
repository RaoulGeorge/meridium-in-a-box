define(function () {
    'use strict';

    function DateTimeResourceFile(culture) {
        this.culture = culture;
    }

    DateTimeResourceFile.prototype.name = function () {
        var culture = this.culture || 'en';
        return 'bootstrap-datetimepicker.' + culture + '.js';
    };

    DateTimeResourceFile.prototype.url = function (path) {
        return path + '/' + this.name();
    };

    return DateTimeResourceFile;
});