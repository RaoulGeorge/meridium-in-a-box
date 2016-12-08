define(function (require) {
    'use strict';

    var ko = require('knockout');

    function EmailSettingsModel(dto) {
        var self = this;

        dto = dto || {};

        this.useDropFolder = ko.observable(dto.useDropFolder);
        this.specificFolder = ko.observable(dto.specificFolder);
        this.emailHost = ko.observable(dto.emailHost);
        this.defaultFrom=ko.observable(dto.defaultFrom);
    }



    return EmailSettingsModel;
});