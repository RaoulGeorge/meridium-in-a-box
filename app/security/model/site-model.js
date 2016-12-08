define(function (require) {
    'use strict';

    var ko = require('knockout'),
        UserSiteDTO = require('../services/usersite-dto'),
        UserSiteAdapter = require('../adapters/usersite-adapter');

    function SiteModel(dto) {
        var self = this;

        dto = dto || {};

        this.name = ko.observable(dto.name);
        this.key = ko.observable(dto.key);
        this.lockSeq = ko.observable(dto.lockSeq);
        this.users = ko.observableArray(UserSiteAdapter.toModelArray(dto.users));
    }

    return SiteModel;
});