define(function (require) {
    'use strict';

    var _ = require('lodash');

    var DomainDTO = require('../services/domain-dto'),
        LdapPropertyDTO = require('../services/ldap-property-dto'),
        LdapAdapter = require('./ldap-property-adapter'),
        DomainUserAdapter=require('./domain-user-adapter'),
        DomainModel = require('../model/domain-model');

    function DomainAdapter() {

    }

    DomainAdapter.toModelObject =
        function domainAdapter_toModelObject(dto) {
            return new DomainModel(dto);
        };

    DomainAdapter.toModelObjectArray =
        function domainAdapter_toModelObjectArray(dtos) {
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
    DomainAdapter.toModelObjectHierarchy =
        function domainAdapter_toModelObjectHierarchy(dtos) {
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

    DomainAdapter.toDTO =
        function domainAdapter_toDTO(model) {
            var dto = new DomainDTO();
            model = model || {};

            dto.key = model.key();
            dto.allUserFilter = model.allUserFilter();
            dto.singleUserFilter = model.singleUserFilter();
            dto.domainName = model.domainName();
            dto.rootCaption = model.rootCaption();
            dto.domainNetBiosName = model.domainNetBiosName();
            dto.domainCaption = model.domainCaption();
            dto.domainGroupFilter = model.domainGroupFilter();
            dto.lockSeq = model.lockSeq();
            dto.propertyMappings = [];
            dto.users = [];
            model.propertyMappings().forEach(function (item) {
                dto.propertyMappings.push(LdapAdapter.toDTO(item));
            });
            model.users().forEach(function (item) {
                dto.users.push(DomainUserAdapter.toDTO(item));
            });
            return dto;
        };

    return DomainAdapter;
});