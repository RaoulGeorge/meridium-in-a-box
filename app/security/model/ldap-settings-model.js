define(function (require) {
    'use strict';

    var ko = require('knockout');

    function LdapSettingsModel(dto) {
        var self = this;

        dto = dto || {};


        this.enableLdapIntegration = ko.observable(dto.enableLdapIntegration);
        this.createUsersWithoutDomain = ko.observable(dto.createUsersWithoutDomain);
        this.enableInterfaceLog = ko.observable(dto.enableInterfaceLog);
        this.enableInformationalMessage = ko.observable(dto.enableInformationalMessage);
    }



    return LdapSettingsModel;
});