define(function (require) {
    'use strict';

    var RefDocPathDTO = require('./refdoc-path-dto'),
        RefDocPathModel = require('./refdoc-path-model');

    function RefDocPathAdapter() {

    }

    RefDocPathAdapter.toModel = function toModel(dto) {
        return new RefDocPathModel(dto);
    };

    RefDocPathAdapter.toDTO = function toDTO(model) {
        var dto = new RefDocPathDTO();
        model = model || {};

        dto.isStored = model.isStored();
        dto.isUrl = model.isUrl();
        dto.isUnc = model.isUnc();
        dto.path = model.path();
        dto.formData = model.formData;

        return dto;
    };

    return RefDocPathAdapter;
});