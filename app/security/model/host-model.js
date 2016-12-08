define(function (require) {
    'use strict';

    var ko = require('knockout');
        
    function HostModel(dto) {
        var self = this;
        dto = dto || {};
        this.id = ko.observable(dto.id);
        this.name = ko.observable(dto.name);
        this.idpUrl = ko.observable(dto.idpUrl);
        this.ssoAuthEnabled = ko.observable(dto.ssoAuthEnabled);
    }

    return HostModel;
});