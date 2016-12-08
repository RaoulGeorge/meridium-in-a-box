define(function (require) {
    'use strict';

    var _ = require('lodash');

    var RoleDTO = require('../services/role-dto'),
        RoleModel = require('../model/role-model'),
        UserDTO = require('../services/user-dto'),
        GroupDTO = require('../services/group-dto');

    function RoleAdapter() {

    }

    RoleAdapter.toModelObject =
        function groupAdapter_toModelObject(dto) {
            return new RoleModel(dto);
        };

    RoleAdapter.toModelObjectArray =
        function groupAdapter_toModelObjectArray(dtos) {
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

    /// Convert an array of DTOs into Models.  Simultaneously
    /// convert the flat list into a hierarchical data structure,
    /// using the RoleModel's children property.
    RoleAdapter.toModelObjectHierarchy =
        function groupAdapter_toModelObjectHierarchy(dtos) {
            var rootElements = [],
                models = [];

            if (!dtos || !dtos.length) {
                return;
            }

            models = this.toModelObjectArray(dtos);

            rootElements = findAllModelsWithParentKey(models, '0');

            addChildren(rootElements, models);

            return rootElements;
        };

    function addChildren(parents, models) {
        var i = 0,
            j = 0,
            parent,
            children;

        if (!parents || !parents.length) {
            return;
        }

        for (i = 0; i !== parents.length; i++) {
            parent = parents[i];
            children = findAllModelsWithParentKey(models, parent.key);

            parent.children(children);

            // Set a reference back to the parent.
            for (j = 0; j < parent.children().length; j++) {
                parent.children()[j].parent(parent);
            }

            addChildren(parent.children(), models);
        }
    }

    function findAllModelsWithParentKey(items, parentKey) {
        return _.filter(items, function (item) {
            return item.parentKey().toString() === parentKey;
        });
    }

    RoleAdapter.toDTO =
        function groupAdapter_toDTO(model) {
            var dto = new RoleDTO();

            model = model || {};

            dto.id = model.id();
            dto.key = model.key();
            dto.caption = model.caption();
            dto.description = model.description();

            dto.groups = GroupDTO.fromDataCollection(model.groups());
            dto.users = UserDTO.fromDataCollection(model.users());

            return dto;
        };

    RoleAdapter.toDTOArray =
       function roleAdapter_toDTOArray(models) {
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

    return RoleAdapter;
});