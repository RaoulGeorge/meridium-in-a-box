define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function DomainUserDTO(data) {
        data = data || {};

        this.key = convert.toString(data.key) || '0';
        this.id = convert.toString(data.id);
        this.firstName = convert.toString(data.firstName);
        this.lastName = convert.toString(data.lastName);
    }

    DomainUserDTO.fromDataCollection = function DomainUserDTO_fromDataCollection(dataCollection) {
        if (dataCollection === undefined) {
            return undefined;
        }

        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new DomainUserDTO(dataCollection[i]);
        }
        return dtos;
    };

    return DomainUserDTO;
});