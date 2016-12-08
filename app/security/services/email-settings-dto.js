define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function EmailSettingsDTO(data) {
        data = data || {};

        this.useDropFolder = convert.toBoolean(data.useDropFolder);
        this.specificFolder = convert.toString(data.specificFolder);
        this.emailHost = convert.toString(data.emailHost);
        this.defaultFrom=convert.toString(data.defaultFrom);
    }

    EmailSettingsDTO.fromDataCollection = function EmailSettingsDTO_fromDataCollection(dataCollection) {
        if (dataCollection === undefined) {
            return undefined;
        }

        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new EmailSettingsDTO(dataCollection[i]);
        }
        return dtos;
    };

    return EmailSettingsDTO;
});