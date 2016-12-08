define(function (require) {
    'use strict';

    var $ = require('jquery');

    var AjaxClient = require('system/http/ajax-client'),
        RiskAssessmentDTO = require('../models/risk-assessment-dto'),
        RISK_ASSESSMENT_URL = 'meridium/api/internal/risk/assessments';

    function RiskAssessmentService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    RiskAssessmentService.dependsOn = [AjaxClient];

    RiskAssessmentService.prototype.getDefaultRiskAssessment = function GetDefaultRiskAssessment(matrixKey) {
        var dfd = $.Deferred();

        this.ajaxClient.get(RISK_ASSESSMENT_URL + '/new/' + matrixKey).done(function (data) {
            dfd.resolve(new RiskAssessmentDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };
    RiskAssessmentService.prototype.getDefaultMitigatedRiskAssessment = function DefaultMitigatedRiskAssessment(key) {
        var dfd = $.Deferred();

        this.ajaxClient.get(RISK_ASSESSMENT_URL + '/copy/' + key).done(function (data) {
            dfd.resolve(new RiskAssessmentDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };
    RiskAssessmentService.prototype.getRiskAssessment = function riskAssessmentService_getRiskAssessment(key) {
        var dfd = $.Deferred();

        this.ajaxClient.get(RISK_ASSESSMENT_URL + '/' + key).done(function (data) {
            dfd.resolve(new RiskAssessmentDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };
    RiskAssessmentService.prototype.insertRiskAssessment = function riskAssessmentService_insertRiskAssessment(model) {
        var dfd = $.Deferred();

        this.ajaxClient.post(RISK_ASSESSMENT_URL, model).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });

        return dfd.promise();
    };
    RiskAssessmentService.prototype.updateRiskAssessment = function riskAssessmentService_updateRiskAssessment(model) {
        var dfd = $.Deferred();
        var url = RISK_ASSESSMENT_URL;
        this.ajaxClient.put(url, model).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };
    return RiskAssessmentService;
});