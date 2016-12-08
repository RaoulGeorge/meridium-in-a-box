define(function () {
    'use strict';

    function ResourceFile(culture) {
        this.culture = culture;
    }

    ResourceFile.prototype.name = function () {
        var culture = this.culture || 'en';
        return culture === 'en' ? 'resources.json' : 'resources.' + culture + '.json';
    };

    ResourceFile.prototype.url = function (path) {
        var fileUrl = path + '/' + this.name(),
            queryString = '?v=1.0';
        return fileUrl + queryString;
    };

    return ResourceFile;
});