define(function (require) {
    'use strict';

    var Converter = require('system/lang/converter'),
        RiskRankDTO = require('ui/elements/risk-matrix/models/risk-rank-dto');

    function RiskAssessmentDTO(data) {
        data = data || {};

        this.key = Converter.toString(data.key);
        this.riskMatrixKey = Converter.toString(data.riskMatrixKey);
        this.siteKey = Converter.toString(data.siteKey);

        this.globalID = Converter.toString(data.globalID);
        this.familyID = Converter.toString(data.familyID);

        this.financialRiskRank = Converter.toFloat(data.financialRiskRank);
        this.riskRank = Converter.toFloat(data.riskRank);
        this.drivingRiskRank = Converter.toFloat(data.drivingRiskRank);

        this.riskRankAlias = Converter.toString(data.riskRankAlias);
        this.riskThreshold = Converter.toString(data.riskThreshold);
        this.riskThresholdAlias = Converter.toString(data.riskThresholdAlias);

        this.drivingRiskCategory = Converter.toString(data.drivingRiskCategory);
        this.drivingRiskAlias = Converter.toString(data.drivingRiskAlias);
        this.drivingRiskThreshold = Converter.toString(data.drivingRiskThreshold);
        this.drivingRiskThresholdAlias = Converter.toString(data.drivingRiskThresholdAlias);

        this.basisForAssessment = Converter.toString(data.basisForAssessment);

        this.risks = RiskRankDTO.fromDataCollection(data.risks);
    }

    RiskAssessmentDTO.fromDataCollection = function fromDataCollection(dataCollection) {
        var i, dtos = [];
        if (dataCollection) {
            for (i = 0; i < dataCollection.length; i++) {
                dtos[i] = new RiskAssessmentDTO(dataCollection[i]);
            }
        }
        return dtos;
    };

    RiskAssessmentDTO.isEqual = function fromDataCollection(dto1, dto2) {
        var i, j, index,
            properties = ['key',
                            'riskMatrixKey',
                            'globalID',
                            'familyID',
                            'financialRiskRank',
                            'riskRank',
                            'drivingRiskRank',
                            'riskRankAlias',
                            'riskThreshold',
                            'riskThresholdAlias',
                            'drivingRiskCategory',
                            'drivingRiskAlias',
                            'drivingRiskThreshold',
                            'drivingRiskThresholdAlias',
                            'basisForAssessment'];
        for (i = 0; i < properties.length; i++) {
            if (dto1[properties[i]] !== dto2[properties[i]]) {
                return false;
            }
        }

        if (dto1.risks.length !== dto2.risks.length) {
            return false;
        }

        for (i = 0; i < dto1.risks.length; i++) {
            index = dto1.risks[i].index;
            for (j = 0; j < dto2.risks.length; j++) {
                if (index === dto2.risks[j].index) {
                    if (!RiskRankDTO.isEqual(dto1.risks[i], dto2.risks[j])) {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    return RiskAssessmentDTO;
});
