define(function (require) {
    'use strict';
    var Converter = require('system/lang/converter'),
        RiskCategoryDTO = require('ui/elements/risk-matrix/models/risk-category-dto'),
        RiskThresholdDTO = require('ui/elements/risk-matrix/models/risk-threshold-dto');

    function RiskMatrixDTO(data) {
        this.key = data.key.toString();
        this.name = Converter.toString(data.name);

        this.isLogarithmic = Converter.toBoolean(data.isLogarithmic);
        this.isDefault = Converter.toBoolean(data.isDefault);
        this.showAlias = Converter.toBoolean(data.showAlias);
        this.isUsingMaxRisk = Converter.toBoolean(data.isUsingMaxRisk);
        this.hideNumericRiskRank = Converter.toBoolean(data.hideNumericRiskRank);
        this.hideProtectionLevelText = Converter.toBoolean(data.hideProtectionLevelText);
        this.hideProbabilityAndConsequenceNames = Converter.toBoolean(data.hideProbabilityAndConsequenceNames);
        this.lockMitigatedConsequence = Converter.toBoolean(data.lockMitigatedConsequence);
        this.maxRiskRank = Converter.toFloat(data.maxRiskRank);

        this.aliasMask = Converter.toString(data.aliasMask);
        this.dialogCaption = Converter.toString(data.dialogCaption);
        this.currency = Converter.toString(data.currency);
        this.consequenceAxisValue = Converter.toString(data.consequenceAxisValue);
        this.probabilityAxisValue = Converter.toString(data.probabilityAxisValue);
        this.consequenceSortOrderValue = Converter.toString(data.consequenceSortOrderValue);
        this.probabilitySortOrderValue = Converter.toString(data.probabilitySortOrderValue);

        this.unmitigatedObjectLabel = Converter.toString(data.unmitigatedObjectLabel);
        this.mitigatedObjectLabel = Converter.toString(data.mitigatedObjectLabel);
        this.unmitigatedRiskLabel = Converter.toString(data.unmitigatedRiskLabel);
        this.mitigatedRiskLabel = Converter.toString(data.mitigatedRiskLabel);

        this.thresholds = RiskThresholdDTO.fromDataCollection(data.thresholds);
        this.categories = RiskCategoryDTO.fromDataCollection(data.categories, this);
    }

    RiskMatrixDTO.fromDataCollection = function fromDataCollection(dataCollection) {
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[i] = new RiskMatrixDTO(dataCollection[i]);
        }
        return dtos;
    };

    return RiskMatrixDTO;
});
