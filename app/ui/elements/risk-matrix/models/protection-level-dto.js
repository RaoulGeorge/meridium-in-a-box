define(function (require) {
    'use strict';
    var Converter = require('system/lang/converter');

    function ProtectionLevelDTO(data) {

        this.key = data.key.toString();
        this.factor = Converter.toInteger(data.factor);
        this.nameID = Converter.toString(data.name);
        this.descriptionID = Converter.toString(data.description);
        this.alias = Converter.toString(data.alias);
        this.formattedName = Converter.toString(data.formattedName);
        this.formattedDescription = Converter.toString(data.formattedDescription);
    }

    ProtectionLevelDTO.fromDataCollection = function fromDataCollection(dataCollection) {
        var i, dtos = [];
        if (dataCollection) {
            for (i = 0; i < dataCollection.length; i++) {
                dtos[i] = new ProtectionLevelDTO(dataCollection[i]);
            }
        }
        return dtos;
    };

    return ProtectionLevelDTO;
});
