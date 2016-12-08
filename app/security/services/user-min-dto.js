define(function (require) {
    'use strict';
    var convert = require('system/lang/converter');

    function UserMinDTO(data) {
        data = data || {};
        var dataFormats = data.formats || {};
        this.key = convert.toString(data.key);
        this.id = convert.toString(data.id);
        this.lastName = convert.toString(data.lastName);
        this.firstName = convert.toString(data.firstName);
        this.initial = convert.toString(data.initial);
        this.displayName = this.lastName + ', ' + this.firstName;
        this.fullDisplayName = this.lastName + ', ' + this.firstName + ' (' + this.id + ')';
        this.contentGuid = convert.toString(data.contentGuid);

        this.cultureId = convert.toString(data.cultureId);
        this.timezoneId = convert.toString(data.timezoneId);
        this.defaultSiteKey = data.defaultSiteKey === undefined ? '0' : convert.toString(data.defaultSiteKey);
        this.queryPrivilege = convert.toString(data.queryPrivilege);

        this.isActive = convert.toBoolean(data.isActive);
        this.isSuperUser = convert.toBoolean(data.isSuperUser);
        this.isCatalogAdmin = convert.toBoolean(data.isCatalogAdmin);
        this.isConfigAdmin = convert.toBoolean(data.isConfigAdmin);
        this.isPowerUser = convert.toBoolean(data.isPowerUser);
        this.isSecurityAdmin = convert.toBoolean(data.isSecurityAdmin);
    }

    UserMinDTO.fromDataCollection = function UserDTO_fromDataCollection(dataCollection) {
        if (!dataCollection) {
            return undefined;
        }

        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new UserMinDTO(dataCollection[i]);
        }
        return dtos;
    };

    return UserMinDTO;
});