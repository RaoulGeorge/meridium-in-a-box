define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function GroupDTO(data) {
        data = data || {};

        this.id = convert.toString(data.id);
        this.key = convert.toString(data.key) || '0';
        this.caption = convert.toString(data.caption);
        this.description = convert.toString(data.description);
        this.isActive = convert.toBoolean(data.isActive);
        this.parentKey = convert.toString(data.parentKey) || '0';
        this.lockSeq = convert.toString(data.lockSeq) || '0';
        this.users = require('./user-dto').fromDataCollection(data.users);
        this.roles = require('./role-dto').fromDataCollection(data.roles);
    }

    GroupDTO.fromDataCollection =
        function GroupDTO_fromDataCollection(dataCollection) {
            if (dataCollection === undefined) {
                return undefined;
            }

            var i, dtos = [];
            for (i = 0; i < dataCollection.length; i++) {
                dtos[dtos.length] = new GroupDTO(dataCollection[i]);
            }
            return dtos;
        };

    return GroupDTO;
});