define(function (require) {
    'use strict';

    var ko = require('knockout');

    function GroupModel(dto) {
        var self = this;

        dto = dto || {};

        this.id = ko.observable(dto.id);
        this.key = dto.key;
        this.caption = ko.observable(dto.caption);
        this.description = ko.observable(dto.description);
        this.isActive = ko.observable(dto.isActive);
        this.parentKey = ko.observable(dto.parentKey);
        this.lockSeq = ko.observable(dto.lockSeq);
        this.assignedUsers = ko.observableArray(
            require('../adapters/user-adapter')
                .toModelObjectArray(dto.users));
        this.roles = ko.observableArray(
            require('../adapters/role-adapter')
                .toModelObjectArray(dto.roles));
        this.children = ko.observableArray();
        this.parent = ko.observable();

        // UI logic
        this.isSelected = ko.observable(false);

        this.displayName = ko.computed(function () { return self.caption(); });

        this.hierarchyLevel = ko.computed(function () {
            if (self.parent()) {
                return self.parent().hierarchyLevel() + 1;
            } else {
                return 1;
            }
        });

        this.path = ko.computed(function () {
            var pathArray = [];

            if (self.parent()) {
                pathArray = self.parent().path().slice();
            }

            pathArray.push(self);

            return pathArray;
        });
    }

    return GroupModel;
});