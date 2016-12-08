define(function (require) {
    'use strict';

    var $ = require('jquery');

    var AjaxClient = require('system/http/ajax-client'),
        RiskMatrixDTO = require('ui/elements/risk-matrix/models/risk-matrix-dto'),
        RISK_MATRIX_URL = 'meridium/api/internal/risk/matrix',
        RiskMetaDataDTO = require('platform/risk/models/risk-metadata-dto'),
        DEFAULT_RISK_MATRIX_URL = RISK_MATRIX_URL + '/default',
        RISK_MATRIX_LITE_URL = 'meridium/api/internal/risk/matrix/lite',
        RISK_METADATA_URL = 'meridium/api/internal/risk/metadata';

    function RiskMatrixService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    RiskMatrixService.dependsOn = [AjaxClient];

    RiskMatrixService.prototype.getMetadata = function riskMatrixService_GetMetadata() {
        var dfd = $.Deferred();

        this.ajaxClient.get(RISK_METADATA_URL).done(function (data) {
            dfd.resolve(new RiskMetaDataDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };

    RiskMatrixService.prototype.getRiskMatrices = function riskMatrixService_GetRiskMatrices() {
        var dfd = $.Deferred();

        this.ajaxClient.get(RISK_MATRIX_URL).done(function (data) {
            dfd.resolve(new RiskMatrixDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };

    RiskMatrixService.prototype.getRiskMatricesLite = function riskMatrixService_GetRiskMatricesLite() {
        var dfd = $.Deferred();

        this.ajaxClient.get(RISK_MATRIX_LITE_URL).done(function (data) {
            dfd.resolve(new RiskMatrixDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };

    RiskMatrixService.prototype.getDefaultRiskMatrix = function riskMatrixService_GetDefaultRiskMatrix() {
        var dfd = $.Deferred();

        this.ajaxClient.get(DEFAULT_RISK_MATRIX_URL).done(function (data) {
            dfd.resolve(new RiskMatrixDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };

    RiskMatrixService.prototype.getRiskMatrixByKey = function riskMatrixService_GetRiskMatrixByKey(key) {
        var dfd = $.Deferred();

        this.ajaxClient.get(RISK_MATRIX_URL + '/' + key).done(function (data) {
            dfd.resolve(new RiskMatrixDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };

    return RiskMatrixService;
});
