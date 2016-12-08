define(function (require) {
    'use strict';

    var SiteDTO = require('../services/site-dto'),
        SiteModel = require('../model/site-model'),
        UserSiteAdapter = require('../adapters/usersite-adapter');

    function SiteAdapter() {
    }

    SiteAdapter.toModel =
        function siteAdapter_toModel(dto) {
            return new SiteModel(dto);
        };

    SiteAdapter.toModelArray =
        function siteAdapter_toModelArray(dtos) {
            var i = 0,
                models = [];

            if (!dtos || !dtos.length) {
                return;
            }

            // Convert the DTOs to Model Objects.
            for (i = 0; i !== dtos.length; i++) {
                models.push(this.toModel(dtos[i]));
            }

            return models;
        };

    SiteAdapter.toDTO =
        function siteAdapter_toDTO(model) {
            var dto = new SiteDTO();

            model = model || {};

            dto.name = model.name();
            dto.key = model.key();
            dto.lockSeq = model.lockSeq();
            dto.users = UserSiteAdapter.toDTOArray(model.users());

            return dto;
        };

    SiteAdapter.toDTOArray =
        function siteAdapter_toDTOArray(models) {
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

    return SiteAdapter;
});