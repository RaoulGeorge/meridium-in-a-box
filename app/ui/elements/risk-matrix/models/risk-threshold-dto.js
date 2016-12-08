define(function (require) {
    'use strict';
    var Converter = require('system/lang/converter');

    function RiskThresholdDTO(data) {

        this.value = Converter.toFloat(data.value);
        this.alias = Converter.toString(data.alias);
        this.color = Converter.toString(data.color);
        this.description = Converter.toString(data.description);
        this.formattedDescription = Converter.toString(data.formattedDescription);

    }

    RiskThresholdDTO.fromDataCollection = function fromDataCollection(dataCollection) {
        var i, dtos = [];
        if (dataCollection) {
            for (i = 0; i < dataCollection.length; i++) {
                dtos[i] = new RiskThresholdDTO(dataCollection[i]);
            }
        }
        return dtos;
    };

    return RiskThresholdDTO;
});
