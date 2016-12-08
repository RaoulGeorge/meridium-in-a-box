define(function(require) {
    'use strict';

    var _ = require('lodash');

    function HealthIndicatorModel() {
        this.name = null;
        this.score = null;
        this.valueType = null;
        this.latestValue = null;

        this.lowerLevel3 = null;
        this.lowerLevel2 = null;
        this.lowerLevel1 = null;

        this.upperLevel1 = null;
        this.upperLevel2 = null;
        this.upperLevel3 = null;

        this.settingsStr = null;
    }

    HealthIndicatorModel.fromHealthIndicatorDataCollection = function (hiDataArray) {
        return _.map(hiDataArray, HealthIndicatorModel.fromHealthIndicatorData);
    };

    HealthIndicatorModel.fromHealthIndicatorData = function (hiData) {
        hiData = hiData || {};

        var hiModel = new HealthIndicatorModel();
        hiModel.name = hiData.name;
        hiModel.score = hiData.score;
        hiModel.valueType = hiData.type === 'Numeric' ? 'n': 'c';
        hiModel.latestValue = hiData.lastReading ? hiData.lastReading.value : null;

        if (hiData.limits) {
            _.each(hiData.limits, setLimit.bind(null, hiModel));
        }

        hiModel.settingsStr = JSON.stringify(hiModel);

        return hiModel;
    };

    function setLimit(hiModel, limit) {
        switch (limit.level) {
            case -30:
                hiModel.lowerLevel3 = limit.characterValue || limit.numericValue;
                break;
            case -20:
                hiModel.lowerLevel2 = limit.characterValue || limit.numericValue;
                break;
            case -10:
                hiModel.lowerLevel1 = limit.characterValue || limit.numericValue;
                break;

            case 10:
                hiModel.upperLevel1 = limit.characterValue || limit.numericValue;
                break;
            case 20:
                hiModel.upperLevel2 = limit.characterValue || limit.numericValue;
                break;
            case 30:
                hiModel.upperLevel3 = limit.characterValue || limit.numericValue;
                break;
        }
    }

    return HealthIndicatorModel;
});