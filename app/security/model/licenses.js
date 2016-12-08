define(function (require) {
    'use strict';

    var ApplicationContext = require('application/application-context');

    function hasModule(module) {
        return !!ApplicationContext.licensedModules.findById(module);
    }

    return {
        hasModule: hasModule,
        hasRCM: hasModule.bind(null, 'RCM'),
        hasRBI: hasModule.bind(null, 'RBI'),
        has581: hasModule.bind(null, 'RBI_581'),
        hasSIS: hasModule.bind(null, 'SIS'),
        hasHazards: hasModule.bind(null, 'Hazards'),
        hasASM: hasModule.bind(null, 'ASM'),
        hasPolicyManager: hasModule.bind(null, 'PolicyManager'),
        hasCalibration: hasModule.bind(null, 'Calibration'),
        hasPLA: hasModule.bind(null, 'PLA'),
        hasPROACT: hasModule.bind(null, 'PROACT'),
        hasReliability: hasModule.bind(null, 'Reliability'),
        hasLCC: hasModule.bind(null, 'LCC'),
        hasInspection: hasModule.bind(null, 'Inspection'),
        hasTM: hasModule.bind(null, 'TM'),
        hasOPR: hasModule.bind(null, 'OPR'),
        hasLM: hasModule.bind(null, 'LM'),
        hasMetrics: hasModule.bind(null, 'Metrics'),
        hasDeveloper: hasModule.bind(null,'Developers'),
        hasAHM: hasModule.bind(null, 'AHM'),
        hasGE_M2M: hasModule.bind(null, 'GE_M2M'),
        hasAMS: hasModule.bind(null, 'AMS_Asset_Portal'),
        hasASI: hasModule.bind(null, 'SAP_Content_for_ASI'),
        hasGAA: hasModule.bind(null, "GM"),
        hasPDIOPC: hasModule.bind(null, 'PDI_OPC_XI'),
        hasCognitive: hasModule.bind(null, 'Cognitive')
    };
});
