define(function () {
    'use strict';

    function SystemCodeDTO(data) {
        this.description = data === undefined ? '' : data.description === undefined ? '' : data.description;
        this.caption = data === undefined ? '' : data.caption === undefined ? '' : data.caption;
        this.isDefault = data === undefined ? '' : data.isDefault === undefined ? '' : data.isDefault;
        this.value = data === undefined ? '' : data.value === undefined ? '' : data.value;
    }

    SystemCodeDTO.fromDataCollection = function SystemCodeDTO_fromDataCollection(dataCollection) {
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new SystemCodeDTO(dataCollection[i]);
        }
        return dtos;
    };

    return SystemCodeDTO;
});