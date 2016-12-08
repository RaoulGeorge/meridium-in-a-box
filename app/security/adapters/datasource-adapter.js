define(function (require) {
    'use strict';

    var DatasourceDTO = require('../services/datasource-dto'),
        DatasourceModel = require('../model/datasource-model');
      
    function DatasourceAdapter() {

    }

    DatasourceAdapter.toModelObject =
        function datasourceModel_toModelObject(dto) {
            return new DatasourceModel(dto);
        };

    /// Convert an array of DTOs into Models.  Simultaneously
    /// convert the flat list into a hierarchical data structure,
    /// using the UserModel's children property.
    DatasourceAdapter.toModelObjectArray =
        function datasourceModel_toModelObjectArray(dtos) {
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

    DatasourceAdapter.toDTO =
        function datasourceModel_toDTO(model) {
            var dto = new DatasourceDTO();

            model = model || {};

            
            dto.id = model.id;   
            dto.description =model.description();
            dto.isDefault =model.isDefault();
            dto.hostName =model.hostName();
            dto.databaseType =model.databaseType();

            dto.userId =model.userId();
            dto.password =model.password();
            dto.databaseName =model.databaseName();
            dto.serverName =model.serverName();
            dto.alias =model.alias();

            dto.oraclehost =model.oraclehost();
            dto.oracleport =model.oracleport();
            dto.oracleservice =model.oracleservice();
            dto.preloadcache = model.preloadcache();
            dto.isOffline = model.isOffline();


            return dto;
        };

    DatasourceAdapter.toDTOArray =
        function datasourceAdapter_toDTOArray(models) {
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

    return DatasourceAdapter;
});