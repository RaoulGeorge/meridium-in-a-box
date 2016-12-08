define(function (require) {
    'use strict';

    var ko = require('knockout');

    function LdapPropertyModel(dto) {
        var self = this;

        dto = dto || {};
        this.key = ko.observable(dto.key);
        this.ldapName = ko.observable(dto.ldapName);
        this.apmName = ko.observable(dto.apmName);
    }
    return LdapPropertyModel;
});