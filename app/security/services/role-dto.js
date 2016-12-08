define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function RoleDTO(data) {
        data = data || {};

        this.id = convert.toString(data.id);
        this.key = convert.toString(data.key) || '0';
        this.caption = convert.toString(data.caption);
        this.description = convert.toString(data.description);
        this.users = require('./user-dto').fromDataCollection(data.users);
        this.groups = require('./group-dto').fromDataCollection(data.groups);
    }

    RoleDTO.fromDataCollection =
        function RoleDTO_fromDataCollection(dataCollection) {
            if (dataCollection === undefined) {
                return undefined;
            }

            var i, dtos = [];
            for (i = 0; i < dataCollection.length; i++) {
                dtos[dtos.length] = new RoleDTO(dataCollection[i]);
            }
            return dtos;
        };

    return RoleDTO;
});