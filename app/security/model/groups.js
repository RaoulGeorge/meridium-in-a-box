define(function (require) {
    'use strict';

    var _ = require('lodash');

    var ApplicationContext = require('application/application-context');

    function isSuperUser() {
        return !!ApplicationContext.user.isSuperUser;
    }

    function hasGroup(id) {
        return !!_.find(ApplicationContext.user.groups || [], { id: id });
    }

    return {
        isSuperUser: isSuperUser,
        hasMIOperatorRoundsMobileUser: hasGroup.bind(null, 'MI Operator Rounds Mobile User'),
        hasMIOperatorRoundsAdministrator: hasGroup.bind(null, 'MI Operator Rounds Administrator'),
        hasMIRoundsDesignerViewer: hasGroup.bind(null, 'MI Rounds Designer Viewer'),
        hasMICalibrationUser: hasGroup.bind(null, 'MI Calibration User'),
        hasMISecurityRole: hasGroup.bind(null, 'MI Security Role'),
        hasMIConfigurationRole: hasGroup.bind(null, 'MI Configuration Role'),
        hasMIPowerUserRole: hasGroup.bind(null, 'MI Power User Role'),
        hasMIAHIAdmin: hasGroup.bind(null, 'MI AHI Administrator'),
        hasMIAHIUserRole: hasGroup.bind(null, 'MI AHI User'),
        hasMIAHIViewerRole: hasGroup.bind(null, 'MI AHI Viewer'),
        hasMIAMSAdmin: hasGroup.bind(null, 'MI AMS Asset Portal Administrator'),
        hasMIAMSPowerUserRole: hasGroup.bind(null, 'MI AMS Asset Portal Power User'),
        hasMIAMSUserRole: hasGroup.bind(null, 'MI AMS Asset Portal User'),
        hasMIAMSViewerRole: hasGroup.bind(null, 'MI AMS Asset Portal Viewer'),
        hasMIGEAdmin: hasGroup.bind(null, 'MI GE Administrator'),
        hasMIGEUserRole: hasGroup.bind(null, 'MI GE User'),
        hasMIGEViewerRole: hasGroup.bind(null, 'MI GE Viewer'),
        hasMIPDIAdmin: hasGroup.bind(null, 'MI Process Data Integration Administrator'),
        hasMIACAAdministrator: hasGroup.bind(null, 'MI ACA Administrator'),
        hasMIASIAdministrator: hasGroup.bind(null, 'MI ASI Administrator'),
        hasMIASMAdministrator: hasGroup.bind(null, 'MI ASM Management Administrator'),
        hasMICalibrationAdministrator: hasGroup.bind(null, 'MI Calibration Administrator'),
        hasMIRCMAdministrator: hasGroup.bind(null, 'MI RCM Administrator'),
        hasMIHAAdministrator: hasGroup.bind(null, 'MI HA Administrator'),
        hasMIMetricsAdministrator: hasGroup.bind(null, 'MI Metrics Administrator'),
        hasMIProductionLossAccountingAdministrator: hasGroup.bind(null, 'MI Production Loss Accounting Administrator'),
        hasMIPROACTAdmin: hasGroup.bind(null, 'MI PROACT Admin'),
        hasMISISAdministrator: hasGroup.bind(null, 'MI SIS Administrator'),
        hasAPMNowAdmin: hasGroup.bind(null, 'MI APMNow Admin'),
        hasLubricationManagementUser: hasGroup.bind(null, 'MI Lubrication Management User'),
        hasLubricationManagementAdmin: hasGroup.bind(null, 'MI Lubrication Management Administrator'),
        hasDataLoaderUserRole: hasGroup.bind(null, 'MI CMMS Interface User'),
        hasDataLoaderAdminRole: hasGroup.bind(null, 'MI CMMS Interface Administrator'),
        hasGaaAdministrator: hasGroup.bind(null, "MI Generation Management Administrator"),
        hasGaaAnalyst: hasGroup.bind(null, "MI Generation Management Analyst"),
        hasGaaViewer: hasGroup.bind(null, "MI Generation Management"),
        hasCognitiveAdministrator: hasGroup.bind(null, 'MI Cognitive Administrator'),
        hasCognitiveUser: hasGroup.bind(null, 'MI Cognitive User'),
        hasMAPMSecurityGroup: hasGroup.bind(null, 'MAPM Security Group')
    };
});
