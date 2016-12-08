define(function () {
    'use strict';

    function CultureDTO(data) {
        this.name = data === undefined ? '' : data.name === undefined ? '' : data.name;
        this.id = data === undefined ? '' : data.id === undefined ? '' : data.id;
    }

    CultureDTO.fromDataCollection = function SystemCodeDTO_fromDataCollection(dataCollection) {
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new CultureDTO(dataCollection[i]);
        }
        return dtos;
    };

    return CultureDTO;
});