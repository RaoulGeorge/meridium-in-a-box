define(function () {
    'use strict';

    function TimezoneDTO(data) {
        this.name = data === undefined ? '' : data.name === undefined ? '' : data.name;
        this.id = data === undefined ? '' : data.id === undefined ? '' : data.id;
    }

    TimezoneDTO.fromDataCollection = function SystemCodeDTO_fromDataCollection(dataCollection) {
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new TimezoneDTO(dataCollection[i]);
        }
        return dtos;
    };

    return TimezoneDTO;
});