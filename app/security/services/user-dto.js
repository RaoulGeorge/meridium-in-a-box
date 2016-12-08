define(function (require) {
    'use strict';
    var GroupDTO = require('./group-dto'),
        UserSiteDTO = require('./usersite-dto'),
        RoleDTO = require('./role-dto'),
        PrivilegeGrantDTO = require('./fmlypriv-dto'),
        convert = require('system/lang/converter');

    function UserDTO(data) {
        data = data || {};
        var dataFormats = data.formats || {};
        this.key = convert.toString(data.key);
        this.id = convert.toString(data.id);
        this.lastName = convert.toString(data.lastName);
        this.firstName = convert.toString(data.firstName);
        this.initial = convert.toString(data.initial);
        this.displayName = this.lastName + ', ' + this.firstName + ' ' + this.initial;
        this.fullDisplayName = this.lastName + ', ' + this.firstName + ' (' + this.id + ')';
        this.contentGuid = convert.toString(data.contentGuid);

        this.cultureId = convert.toString(data.cultureId);
        this.timezoneId = convert.toString(data.timezoneId);
        this.ianaTimezoneId = convert.toString(data.timezoneIanaId);
        this.defaultSiteKey = data.defaultSiteKey === undefined ? '0' : convert.toString(data.defaultSiteKey);
        this.queryPrivilege = convert.toString(data.queryPrivilege);

        this.isActive = convert.toBoolean(data.isActive);
        this.isSuperUser = convert.toBoolean(data.isSuperUser);
        this.isCatalogAdmin = convert.toBoolean(data.isCatalogAdmin);
        this.isConfigAdmin = convert.toBoolean(data.isConfigAdmin);
        this.isPowerUser = convert.toBoolean(data.isPowerUser);
        this.isSecurityAdmin = convert.toBoolean(data.isSecurityAdmin);

        this.address1 = convert.toString(data.address1);
        this.address2 = convert.toString(data.address2);
        this.areaOfResponsibility = convert.toString(data.areaOfResponsibility);
        this.badgeId = convert.toString(data.badgeId);
        this.businessUnit = convert.toString(data.businessUnit);
        this.city = convert.toString(data.city);
        this.comments = convert.toString(data.comments);
        this.company = convert.toString(data.company);
        this.country = convert.toString(data.country);
        this.department = convert.toString(data.department);
        this.domain = convert.toString(data.domain);
        this.email = convert.toString(data.email);
        this.facility = convert.toString(data.facility);
        this.faxNumber = convert.toString(data.faxNumber);
        this.siteCode = convert.toString(data.siteCode);

        this.formats = {
            longDate: dataFormats.longDate || 'D',
            shortDate: dataFormats.shortDate || 'd',
            longTime: dataFormats.longTime || 'T',
            shortTime: dataFormats.shortTime || 't',
            dateTime: dataFormats.dateTime || 'd' + 't'
        };

        this.groups = GroupDTO.fromDataCollection(data.groups);
        this.sites = UserSiteDTO.fromDataCollection(data.sites);
        this.roles = RoleDTO.fromDataCollection(data.roles);
        this.privileges = PrivilegeGrantDTO.fromDataCollection(data.privileges);

        this.newPassword = convert.toString(data.newPassword);
        this.unhashedPassword = convert.toString(data.unhashedPassword);
        this.password = convert.toString(data.password);
        this.phoneNumber = convert.toString(data.phoneNumber);
        this.phoneNumber2 = convert.toString(data.phoneNumber2);
        this.postalCode = convert.toString(data.postalCode);
        this.state = convert.toString(data.state);
        this.title = convert.toString(data.title);
        this.uomConversionSetId = convert.toString(data.uomConversionSetId);
        this.hasThumbnailPhoto = convert.toBoolean(data.hasThumbnailPhoto);
        this.mustChangePassword = convert.toBoolean(data.mustChangePassword);
        this.isLocked = convert.toBoolean(data.isLocked);
        this.failedLogins = convert.toString(data.failedLogins);
        this.userLockSeq = convert.toString(data.userLockSeq);
        this.hrLockSeq = convert.toString(data.hrLockSeq);
        this.isSelected = false;
        this.isDirty = false;
    }

    UserDTO.fromDataCollection = function UserDTO_fromDataCollection(dataCollection) {
        if (!dataCollection) {
            return undefined;
        }

        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new UserDTO(dataCollection[i]);
        }
        return dtos;
    };

    return UserDTO;
});