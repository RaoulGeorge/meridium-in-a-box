define(function (require) {
    'use strict';
    var Converter = require('system/lang/converter');

    function RiskRankDTO(data) {
        data = data || {};

        this.key = Converter.toString(data.key);
        this.categoryName = Converter.toString(data.categoryName);
        this.consequence = Converter.toNullableFloat(data.consequence);
        this.maintenanceCost = Converter.toNullableFloat(data.maintenanceCost);
        this.productionLoss = Converter.toNullableFloat(data.productionLoss);
        this.probability = Converter.toNullableFloat(data.probability);
        this.protectionLevel = Converter.toNullableFloat(data.protectionLevel);
        this.rank = Converter.toNullableFloat(data.rank);

        this.index = Converter.toNullableFloat(data.index);
        this.weight = Converter.toNullableFloat(data.weight);

        this.notApplicable = Converter.toNullableBoolean(data.notApplicable);
        this.isFinancial = Converter.toNullableBoolean(data.isFinancial);

        this.riskRankAlias = Converter.toString(data.riskRankAlias === ' - ' ? null : data.riskRankAlias);
        this.probabilities = data.probabilities || [];
    }

    RiskRankDTO.fromDataCollection = function fromDataCollection(dataCollection) {
        var i, dtos = [];
        if (dataCollection) {
            for (i = 0; i < dataCollection.length; i++) {
                dtos[i] = new RiskRankDTO(dataCollection[i]);
            }
        }
        return dtos;
    };

    RiskRankDTO.isEqual = function fromDataCollection(dto1, dto2) {
        var i, j,
            properties = ['key',
                            'categoryName',
                            'consequence',
                            'maintenanceCost',
                            'productionLoss',
                            'probability',
                            'protectionLevel',
                            'rank',
                            'index',
                            'weight',
                            'notApplicable',
                            'isFinancial',
                            'riskRankAlias'];

        for (i = 0; i < properties.length; i++) {
            if (dto1[properties[i]] !== dto2[properties[i]]) {
                return false;
            }
        }
        return true;
    };

    return RiskRankDTO;
});
