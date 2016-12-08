define(function (require) {
    'use strict';

    var ko = require('knockout');
    require('system/lang/object');

    function RefDocPathModel(dto) {
        var self = this;

        dto = dto || {};

        self.isStored = ko.observable(dto.isStored);
        self.isUrl = ko.observable(dto.isUrl);
        self.isUnc = ko.observable(dto.isUnc);
        self.path = ko.observable(dto.path);
        self.formData = dto.formData;
    }

    return RefDocPathModel;
});