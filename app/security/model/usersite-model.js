define(function (require) {
    'use strict';

    var ko = require('knockout'),
        UserSiteDTO = require('../services/usersite-dto');

    function UserSiteModel(dto) {
        var self = this;

        dto = dto || {};

        this.key = ko.observable(dto.key);
        this.siteKey = ko.observable(dto.siteKey);
        this.userKey = ko.observable(dto.userKey);
        this.viewOnly = ko.observable(dto.viewOnly);
        this.siteName = ko.observable(dto.siteName);
        this.userName = ko.observable(dto.userName);
        this.lockSeq = ko.observable(dto.lockSeq);
        this.selected = ko.observable(false);
        this.defaultSite = ko.observable(false);
    }

    return UserSiteModel;
});