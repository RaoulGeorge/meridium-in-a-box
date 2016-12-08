define(function (require) {
    'use strict';
    var Converter = require('system/lang/converter');

    function ProbabilityDTO(data) {

        this.key = data.key.toString();
        this.factor = Converter.toFloat(data.factor);
        var factorUIVal;
        if (data.factorUI) {
            factorUIVal = data.factorUI;
        }
        else {
            factorUIVal = Converter.toFloat(data.factor);
        }
        this.factorUI = factorUIVal;
        this.nameID = Converter.toString(data.name);
        this.descriptionID = Converter.toString(data.description);
        this.alias = Converter.toString(data.alias);
        this.formattedName = Converter.toString(data.formattedName);
        this.formattedDescription = Converter.toString(data.formattedDescription);
        this.headerTitle = '';
        this.headerValue = '';
    }

    ProbabilityDTO.fromDataCollection = function fromDataCollection(dataCollection) {
        var i, dtos = [];
        if (dataCollection) {
            for (i = 0; i < dataCollection.length; i++) {
                dtos[i] = new ProbabilityDTO(dataCollection[i]);
            }
        }
        return dtos;
    };

    return ProbabilityDTO;
});
