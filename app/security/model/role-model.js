define(function (require) {
    'use strict';

    var ko = require('knockout'),
        GroupDTO = require('../services/group-dto'),
        UserDTO = require('../services/user-dto');

    function RoleModel(dto) {
        var self = this;

        dto = dto || {};

        this.id = ko.observable(dto.id);
        this.key = ko.observable(dto.key);
        this.caption = ko.observable(dto.caption);
        this.description = ko.observable(dto.description);

        this.groups = ko.observableArray(GroupDTO.fromDataCollection(dto.groups));
        this.users = ko.observableArray(UserDTO.fromDataCollection(dto.users));
    }

    return RoleModel;
});