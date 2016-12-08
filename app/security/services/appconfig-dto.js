define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function AppConfigDTO(data) {
        data = data || {};
        this.key = convert.toString(data.key);
        this.configType = convert.toString(data.configType);
        this.name = convert.toString(data.name);
        this.description = convert.toString(data.description);
        this.value = convert.toString(data.value);
        this.itemType = convert.toString(data.itemType);
        this.defaultValue = convert.toString(data.defaultValue);
        this.minValue = convert.toString(data.minValue);
        this.maxValue = convert.toString(data.maxValue);
        this.unitOfMeasure = convert.toString(data.unitOfMeasure);
    }

    AppConfigDTO.fromDataCollection = function AppConfigDTO_fromDataCollection(dataCollection) {
        if (dataCollection === undefined) {
            return undefined;
        }

        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new AppConfigDTO(dataCollection[i]);
        }
        return dtos;
    };

    return AppConfigDTO;
});