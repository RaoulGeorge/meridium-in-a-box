define(function (require) {
    'use strict';

    var _ = require('lodash');

    var Device = require('system/hardware/device');
        // AdminMenuViewModel = require('admin-menu/view-models/admin-menu-view-model');

    function LeftNavSecurity() {
        _.extend(this, configuration());
    }

    LeftNavSecurity.prototype.noAccess = function (module) {
        return !this[module].enabled;
    };

    function configuration() {
        var device = new Device();
        return {
            ASSET_CRITICALITY_ANALYSIS: {
                enabled: true
            },
            FAILURE_MODES_AND_EFFECTS_ANALYSIS: {
                enabled: true
            },
            RELIABILITY_CENTERED_MAINTENANCE: {
                enabled: true
            },
            RISK_BASED_INSPECTION: {
                enabled: true
            },
            MOBILE_PROOF_TEST_DATA_COLLECTION:{
                enabled: true

            },
            SIS_MANAGEMENT: {
                enabled: true
            },
            HAZARDS_ANALYSIS: {
                enabled: true
            },
            LOPA: {
                enabled: true
            },
            ASSET_STRATEGY_MANAGEMENT: {
                enabled: true
            },
            ASSET_STRATEGY_IMPLEMENTATION: {
                enabled: true
            },
            POLICY_MANAGER: {
                enabled: true
            },
            AC_DATA_COLLECTION: {
                enabled: true
            },
            AC_DESIGNER: {
                enabled: true
            },
            INSPECTION_MANAGEMENT: {
                enabled: true
            },
            THICKNESS_MONITORING: {
                enabled: true
            },
            CALIBRATION_MANAGEMENT: {
                enabled: true
            },
            ASSET_HEALTH_MANAGER: {
                enabled: true
            },
            GE_ANALYTICS: {
                enabled: true
            },
            AMS_ANALYTICS: {
                enabled: true
            },
            METRICS_AND_SCORECARDS: {
                enabled: true
            },
            PRODUCTION_LOSS_ANALYSIS: {
                enabled: true
            },
            ROOT_CAUSE_ANALYSIS: {
                enabled: true
            },
            RELIABILITY_ANALYTICS: {
                enabled: true
            },
            ADMIN: {
                enabled: true
            },
            SECURITY_MANAGER: {
                enabled: true
            },
            OPERATIONS_MANAGER: {
                enabled: true
            },
            CONFIGURATION_MANAGER: {
                enabled: true
            },
            APPLICATION_SETTINGS: {
                enabled: true
            },
            DATASET: {
                enabled: true
            },
            DATA_LOADERS: {
                enabled: true
            },
            COGNITIVE_ANALYTICS: {
                enabled: true
            },
            DATA_HUB: {
                enabled: true
            },
            GENERATION_AVAILABILITY_ANALYSIS: {
                enabled: true
            },
            LIFE_CYCLE_COST_ANALYSIS: {
                enabled: true
            },
        };
    }

    

    return LeftNavSecurity;
});
