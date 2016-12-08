define(function (require) {
    'use strict';

    var _ = require('lodash');

    var FmlyPrivDTO = require('../services/fmlypriv-dto'),
        FmlyPrivModel = require('../model/fmlypriv-model');

    function FmlyPrivAdapter() {

    }

    FmlyPrivAdapter.toModelObject =
        function fmlyPrivAdapter_toModelObject(dto) {
            return new FmlyPrivModel(dto);
        };

    FmlyPrivAdapter.toModelObjectArray =
        function fmlyPrivAdapter_toModelObjectArray(dtos) {
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
    FmlyPrivAdapter.toModelObjectHierarchy =
        function fmlyPrivAdapter_toModelObjectHierarchy(dtos) {
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

    FmlyPrivAdapter.toDTO =
        function fmlyPrivAdapter_toDTO(model) {
            var dto = new FmlyPrivDTO();
            model = model || {};

            dto.key = model.key();
            dto.userKey = model.userKey();
            dto.userDisplay = model.userDisplay();
            dto.groupKey = model.groupKey();
            dto.groupDisplay = model.groupDisplay();
            dto.familyKey = model.familyKey();
            dto.familyDisplay = model.familyDisplay();
            dto.privilege = model.privilege();
            dto.ins = model.ins();
            dto.vw = model.vw();
            dto.upd = model.upd();
            dto.del = model.del();
            dto.isDirty = model.isDirty();
            dto.isDeleted = model.isDeleted();
            return dto;
        };

    return FmlyPrivAdapter;
});