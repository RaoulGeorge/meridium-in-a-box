define(function (require) {
    'use strict';

    var UserDTO = require('../services/user-dto'),
        UserModel = require('../model/user-model'),
        Assert = require('mi-assert'),
        Converter = require('system/lang/converter'),
        RoleDTO = require('../services/role-dto'),
        UserSiteDTO = require('../services/usersite-dto'),
        GroupDTO = require('../services/group-dto');
    function UserAdapter() {

    }

    UserAdapter.serialize = function userAdapter_serialize(dto) {
        return {
            firstName: dto.firstName,
            id: dto.id,
            key: dto.key,
            lastName: dto.lastName,
            email: dto.email,
            initial: dto.initial
        };
    };

    UserAdapter.serializeArray = function userAdapter_serializeArray(dtos) {
        var i = 0,
            models = [];

        if (!dtos || !dtos.length) {
            return;
        }

        // Convert the DTOs to Model Objects.
        for (i = 0; i !== dtos.length; i++) {
            models.push(this.serialize(dtos[i]));
        }

        return models;
    };

    UserAdapter.deserialize = function userAdapter_deserialize(data) {
        Assert.isObject(data, 'data');
        Assert.isString(data.key, 'data.key');
        Assert.isString(data.id, 'data.id');
        //Assert.isString(data.firstName,'data.firstName');
        //Assert.isString(data.lastName, 'data.lastName');
        //Assert.isString(data.email, 'data.lastName');

        var dto = new UserDTO();
        dto.key = Converter.toString(data.key);
        dto.id = Converter.toString(data.id);
        dto.firstName = Converter.toString(data.firstName);
        dto.lastName = Converter.toString(data.lastName);
        dto.initial = Converter.toString(data.initial);
        dto.email = Converter.toString(data.email);

        return dto;
    };

    UserAdapter.deserializeArray = function userAdapter_deserializeArray(data) {
        var i = 0,
            models = [];

        if (!data || !data.length) {
            return;
    }

        // Convert the DTOs to Model Objects.
        for (i = 0; i !== data.length; i++) {
            models.push(this.deserialize(data[i]));
        }

        return models;
    };

    UserAdapter.toModelObject =
        function userAdapter_toModelObject(dto) {
            return new UserModel(dto);
        };

    /// Convert an array of DTOs into Models.  Simultaneously
    /// convert the flat list into a hierarchical data structure,
    /// using the UserModel's children property.
    UserAdapter.toModelObjectArray =
        function userAdapter_toModelObjectArray(dtos) {
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

    UserAdapter.toDTO =
        function userAdapter_toDTO(model) {
            var dto = new UserDTO();

            model = model || {};
            
            dto.firstName = model.firstName();
            dto.id = model.id();
            dto.key = model.key;
            dto.lastName = model.lastName();
            dto.contentGuid = model.contentGuid();
            dto.address1 = model.address1();
            dto.address2 = model.address2();
            dto.areaOfResponsibility = model.areaOfResponsibility();
            dto.badgeId = model.badgeId();
            dto.businessUnit = model.businessUnit();
            dto.city = model.city();
            dto.comments = model.comments();
            dto.company = model.company();
            dto.country = model.country();
            dto.cultureId = model.cultureId();
            dto.defaultSiteKey = model.defaultSiteKey();
            dto.department = model.department();
            dto.domain = model.domain();
            dto.email = model.email();
            dto.facility = model.facility();
            dto.faxNumber = model.faxNumber();
            dto.firstName = model.firstName();
            dto.groups = GroupDTO.fromDataCollection(model.groups());
            dto.roles = RoleDTO.fromDataCollection(model.roles());
            dto.sites = UserSiteDTO.fromDataCollection(model.sites());
            dto.mustChangePassword=model.mustChangePassword();
            dto.initial = model.initial();
            dto.isActive = model.isActive();
            dto.isLocked = model.isLocked();
            dto.isSuperUser = model.isSuperUser();
            dto.newPassword = model.newPassword();
            dto.password = model.password();
            dto.phoneNumber = model.phoneNumber();
            dto.phoneNumber2 = model.phoneNumber2();
            dto.postalCode = model.postalCode();
            dto.queryPrivilege = model.queryPrivilege();
            dto.siteCode = model.siteCode();
            dto.state = model.state();
            dto.timezoneId = model.timezoneId();
            dto.ianaTimezoneId = model.ianaTimezoneId();
            dto.title = model.title();
            dto.uomConversionSetId = model.uomConversionSetId();
            dto.hasThumbnailPhoto = model.hasThumbnailPhoto();
            dto.displayName = model.lastName() + ', ' + model.firstName() + ' ' + model.initial();
            dto.fullDisplayName = model.lastName() + ', ' + model.firstName() + ' (' + model.id() + ')';
            dto.userLockSeq = model.userLockSeq();
            dto.hrLockSeq = model.hrLockSeq();
            dto.isSelected = false;
            dto.isDirty = false;
            return dto;
        };

    UserAdapter.toDTOArray =
        function userAdapter_toDTOArray(models) {
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

    return UserAdapter;
});