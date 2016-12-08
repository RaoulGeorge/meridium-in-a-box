define(function (require) {
    'use strict';

    var _ = require('lodash');

    var DomainUserDTO = require('../services/domain-user-dto'),
        DomainUserModel = require('../model/domain-user-model');

    function DomainUserAdapter() {

    }

    DomainUserAdapter.toModelObject =
        function domainuserAdapter_toModelObject(dto) {
            return new DomainUserModel(dto);
        };

    DomainUserAdapter.toModelObjectArray =
        function domainUserAdapter_toModelObjectArray(dtos) {
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
    /// using the model's children property.
    DomainUserAdapter.toModelObjectHierarchy =
        function domainuserAdapter_toModelObjectHierarchy(dtos) {
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

    DomainUserAdapter.toDTO =
        function domainUserAdapter_toDTO(model) {
            var dto = new DomainUserDTO();
            model = model || {};
            dto.key = model.key();
            dto.id = model.id();
            dto.firstName = model.firstName();
            dto.lastName = model.lastName();
            return dto;
        };

    return DomainUserAdapter;
});