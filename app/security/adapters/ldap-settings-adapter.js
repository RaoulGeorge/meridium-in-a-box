define(function (require) {
    'use strict';

    var _ = require('lodash');

    var LdapSettingsDTO = require('../services/ldap-settings-dto'),
        LdapSettingsModel = require('../model/ldap-settings-model');

    function LdapSettingsAdapter() {

    }

    LdapSettingsAdapter.toModelObject =
        function ldapsettingsAdapter_toModelObject(dto) {
            return new LdapSettingsModel(dto);
        };

    LdapSettingsAdapter.toModelObjectArray =
        function ldapsettingsAdapter_toModelObjectArray(dtos) {
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
    LdapSettingsAdapter.toModelObjectHierarchy =
        function ldapsettingsAdapter_toModelObjectHierarchy(dtos) {
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

    LdapSettingsAdapter.toDTO =
        function ldapsettingsAdapter_toDTO(model) {
            var dto = new LdapSettingsDTO();
            model = model || {};

            dto.enableLdapIntegration = model.enableLdapIntegration();
            dto.createUsersWithoutDomain = model.createUsersWithoutDomain();
            dto.enableInterfaceLog = model.enableInterfaceLog();
            dto.enableInformationalMessage = model.enableInformationalMessage();

            return dto;
        };

    return LdapSettingsAdapter;
});