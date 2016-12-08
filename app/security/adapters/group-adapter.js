define(function (require) {
    'use strict';

    var _ = require('lodash');

    var GroupDTO = require('../services/group-dto'),
        GroupModel = require('../model/group-model');

    function GroupAdapter() {

    }

    GroupAdapter.toModelObject =
        function groupAdapter_toModelObject(dto) {
            return new GroupModel(dto);
        };

    GroupAdapter.toModelObjectArray =
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
    /// using the GroupModel's children property.
    GroupAdapter.toModelObjectHierarchy =
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

    GroupAdapter.toDTO =
        function groupAdapter_toDTO(model, excludeChildren) {
            var dto = new GroupDTO();

            model = model || {};

            dto.id = model.id();
            dto.key = model.key;
            dto.caption = model.caption();
            dto.description = model.description();
            dto.isActive = model.isActive();
            dto.parentKey = model.parentKey();
            dto.lockSeq = model.lockSeq();
            if (!excludeChildren) {
                dto.users = require('./user-adapter').toDTOArray(model.assignedUsers());
                dto.roles = require('./role-adapter').toDTOArray(model.roles());
            }
            return dto;
        };

    GroupAdapter.toDTOArray = function adapter_toDTOArray(models) {
        var i = 0,
            dtos = [];

        if (!models) {
            return;
        }
        if (models.length === 0) {
            return dtos;
        }
        for (i = 0; i !== models.length; i++) {
            dtos.push(this.toDTO(models[i], true));
        }

        return dtos;
    };

    return GroupAdapter;
});