define(function (require) {
    'use strict';

    var HostnameDTO = require('../services/host-dto'),
        HostnameModel = require('../model/host-model');
      
    function HostnamesAdapter() {

    }

    HostnamesAdapter.toModelObject =
        function hostModel_toModelObject(dto) {
            return new HostnameModel(dto);
        };

    /// Convert an array of DTOs into Models.  Simultaneously
    /// convert the flat list into a hierarchical data structure,
    /// using the UserModel's children property.
    HostnamesAdapter.toModelObjectArray =
        function hostModel_toModelObjectArray(dtos) {
            var i = 0,
                models = [];

            if (!dtos || !dtos.length) {
                return;
            }

            // Convert the DTOs to Model Objects.
            for (i = 0; i !== dtos.length; i++) {
                models.push(this.toModelObject(dtos[i]));
            }

            return models;
        };

    HostnamesAdapter.toDTO =
        function hostModel_toDTO(model) {
            var dto = new HostnameDTO();

            model = model || {};

            dto.id=model.id();
            dto.name = model.name();
            dto.idpUrl =model.idpUrl();
            dto.ssoAuthEnabled =model.ssoAuthEnabled();

            return dto;
        };

    HostnamesAdapter.toDTOArray =
        function hostAdapter_toDTOArray(models) {
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

    return HostnamesAdapter;
});