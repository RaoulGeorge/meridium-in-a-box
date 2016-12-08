define(function (require) {
    'use strict';

    var UserSiteDTO = require('../services/usersite-dto'),
        UserSiteModel = require('../model/usersite-model');

    function UserSiteAdapter() {
    }

    UserSiteAdapter.toModel =
        function userSiteAdapter_toModel(dto) {
            return new UserSiteModel(dto);
        };

    UserSiteAdapter.toModelArray =
        function userSiteAdapter_toModelArray(dtos) {
            var i = 0,
                models = [];

            if (!dtos || !dtos.length) {
                return models;
            }

            // Convert the DTOs to Model Objects.
            for (i = 0; i !== dtos.length; i++) {
                models.push(this.toModel(dtos[i]));
            }

            return models;
        };

    UserSiteAdapter.toDTO =
        function userSiteAdapter_toDTO(model) {
            var dto = new UserSiteDTO();

            model = model || {};

            dto.key = model.key();
            dto.siteKey = model.siteKey();
            dto.userKey = model.userKey();
            dto.viewOnly = model.viewOnly();
            dto.siteName = model.siteName();
            dto.userName = model.userName();
            dto.lockSeq = model.lockSeq();
            return dto;
        };

    UserSiteAdapter.toDTOArray =
        function userSiteAdapter_toDTOArray(models) {
            var i = 0,
                dtos = [];

            if (!models) {
                return;
            }
            if (models.length === 0) {
                return dtos;
            }

            // Convert the DTOs to Model Objects.
            for (i = 0; i !== models.length; i++) {
                dtos.push(this.toDTO(models[i]));
            }

            return dtos;
        };

    return UserSiteAdapter;
});