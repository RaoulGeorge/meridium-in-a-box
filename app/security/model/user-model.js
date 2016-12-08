define(function (require) {
    'use strict';

    var ko = require('knockout'),
        RoleDTO = require('../services/role-dto'),
        UserSiteDTO = require('../services/usersite-dto'),
        GroupDTO = require('../services/group-dto');

    function UserModel(dto) {
        var self = this;
        dto = dto || {};
        this.firstName = ko.observable(dto.firstName);
        this.id =  ko.observable(dto.id);
        this.key = dto.key;
        this.lastName = ko.observable(dto.lastName);
        this.contentGuid =  ko.observable(dto.contentGuid);
        this.address1 =  ko.observable(dto.address1);
        this.address2 =  ko.observable(dto.address2);
        this.areaOfResponsibility =  ko.observable(dto.areaOfResponsibility);
        this.badgeId =  ko.observable(dto.badgeId);
        this.businessUnit =  ko.observable(dto.businessUnit);
        this.city =  ko.observable(dto.city);
        this.comments =  ko.observable(dto.comments);
        this.company =  ko.observable(dto.company);
        this.country =  ko.observable(dto.country);
        this.cultureId = ko.observable(dto.cultureId);
        this.defaultSiteKey = ko.observable(dto.defaultSiteKey);
        this.department =  ko.observable(dto.department);
        this.domain =  ko.observable(dto.domain);
        this.email =  ko.observable(dto.email);
        this.facility =  ko.observable(dto.facility);
        this.faxNumber =  ko.observable(dto.faxNumber);
        this.firstName =  ko.observable(dto.firstName);
        this.groups = ko.observableArray(GroupDTO.fromDataCollection(dto.groups));
        this.roles = ko.observableArray(RoleDTO.fromDataCollection(dto.roles));
        this.sites = ko.observableArray(UserSiteDTO.fromDataCollection(dto.sites));
        this.initial =  ko.observable(dto.initial);
        this.isActive = ko.observable(dto.isActive);
        this.isLocked = ko.observable(dto.isLocked);

        this.isSuperUser = ko.observable(dto.isSuperUser);
        this.IsCatalogAdmin = ko.observable(dto.isCatalogAdmin);
        this.IsConfigAdmin = ko.observable(dto.isConfigAdmin);
        this.IsPowerUser = ko.observable(dto.isPowerUser);
        this.IsSecurityAdmin = ko.observable(dto.isSecurityAdmin);

        this.newPassword = ko.observable(dto.newPassword);
        this.mustChangePassword = ko.observable(dto.mustChangePassword);
        this.password =  ko.observable(dto.password);
        this.phoneNumber =  ko.observable(dto.phoneNumber);
        this.phoneNumber2 =  ko.observable(dto.phoneNumber2);
        this.postalCode =  ko.observable(dto.postalCode);
        this.queryPrivilege =  ko.observable(dto.queryPrivilege);
        this.siteCode =  ko.observable(dto.siteCode);
        this.state =  ko.observable(dto.state);
        this.timezoneId =  ko.observable(dto.timezoneId);
        this.ianaTimezoneId = ko.observable(dto.ianaTimezoneId);
        this.title =  ko.observable(dto.title);
        this.uomConversionSetId = ko.observable(dto.uomConversionSetId);
        this.hasThumbnailPhoto = ko.observable(dto.hasThumbnailPhoto);
        if (self.initial() === undefined) {
            this.displayName = ko.computed(function () { return self.lastName() + ', ' + self.firstName(); });
        } else {
            this.displayName = ko.computed(function () { return self.lastName() + ', ' + self.firstName() + ' ' + self.initial(); });
        }
        this.fullDisplayName = ko.computed(function () { return self.lastName() + ', ' + self.firstName() + ' (' + self.id() + ')'; });
        this.contentManagementDisplay=ko.computed(function () { return self.firstName() + ' ' + self.lastName() + ' ' + self.email(); });
        this.userLockSeq = ko.observable(dto.userLockSeq);
        this.hrLockSeq = ko.observable(dto.hrLockSeq);
        this.isSelected = ko.observable(false);
        this.isDirty = ko.observable(false);

        this.isSuperUser.subscribe(onIsSuperUserChanged.bind(null, this));
    }

    function onIsSuperUserChanged(self) {
        var i = 0;

        if (self.isSuperUser()) {
            self.queryPrivilege('0');
        }
    }

    return UserModel;
});