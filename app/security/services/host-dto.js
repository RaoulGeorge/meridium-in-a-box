define(function () {
    'use strict';

    function HostDTO(data) {
        data = data || {};

        this.id = data.id || '';
        this.name=data.name;
        this.idpUrl=data.idpUrl || '';
        this.ssoAuthEnabled=data.ssoAuthEnabled || false;
    }

    HostDTO.fromDataCollection = function HostDTO_fromDataCollection(dataCollection) {
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new HostDTO(dataCollection[i]);
        }
        return dtos;
    };

    return HostDTO;
});