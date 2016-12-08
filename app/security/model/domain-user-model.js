define(function (require) {
    'use strict';

    var ko = require('knockout');

    function DomainUserModel(dto) {
        var self = this;

        dto = dto || {};

        this.key = ko.observable(dto.key);
        this.id = ko.observable(dto.id);
        this.firstName = ko.observable(dto.firstName);
        this.lastName = ko.observable(dto.lastName);
        this.displayName = ko.computed(function () { return self.lastName() + ', ' + self.firstName(); });
    }



    return DomainUserModel;
});