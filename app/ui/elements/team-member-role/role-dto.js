define(function (require) {
    'use strict';
    var Converter = require('system/lang/converter');

    function RoleDTO(data) {
        data = data || {};
        this.roleId = Converter.toInteger(data.roleId);
        this.role = Converter.toString(data.role);
    }

    RoleDTO.fromDataCollection = function fromDataCollection(dataCollection) {
        var i, dtos = [];
        if (dataCollection) {
            for (i = 0; i < dataCollection.length; i++) {
                dtos[i] = new RoleDTO(dataCollection[i]);
            }
        }
        return dtos;
    };

    return RoleDTO;
});