define(function (require) {
    'use strict';

    var ko = require('knockout'),
    DomainUserModel=require('./domain-user-model'),
    LdapPropertyModel=require('./ldap-property-model');

    function DomainModel(dto) {
        var self = this;

        dto = dto || {};
        this.key = ko.observable(dto.key);
        this.allUserFilter = ko.observable(dto.allUserFilter);
        this.singleUserFilter = ko.observable(dto.singleUserFilter);
        this.domainName = ko.observable(dto.domainName);
        this.rootCaption = ko.observable(dto.rootCaption);
        this.domainNetBiosName = ko.observable(dto.domainNetBiosName);
        this.domainCaption = ko.observable(dto.domainCaption);
        this.domainGroupFilter = ko.observable(dto.domainGroupFilter);
        this.lockSeq = ko.observable(dto.lockSeq);

        var tempArray = [];
        dto.propertyMappings.forEach(function (item) {
            tempArray.push(new LdapPropertyModel(item));
        });
        this.propertyMappings = ko.observableArray(tempArray);

        var tempArray1 = [];
        dto.users.forEach(function (item) {
            tempArray1.push(new DomainUserModel(item));
        });
        this.users = ko.observableArray(tempArray1);

    }

   

    return DomainModel;
});