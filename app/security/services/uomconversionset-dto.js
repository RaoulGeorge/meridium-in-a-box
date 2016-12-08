define(function () {
    'use strict';

    function UomConversionSetDTO(data) {
        this.description = data === undefined ? '' : data.description === undefined ? '' : data.description;
        this.id = data === undefined ? '' : data.id === undefined ? '' : data.id;
        this.key = data === undefined ? '' : data.key === undefined ? '' : data.key;
    }

    UomConversionSetDTO.fromDataCollection = function SystemCodeDTO_fromDataCollection(dataCollection) {
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new UomConversionSetDTO(dataCollection[i]);
        }
        return dtos;
    };

    return UomConversionSetDTO;
});