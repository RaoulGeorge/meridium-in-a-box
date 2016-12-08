define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        InspectionSyncService = require('rounds/services/inspection-sync-service');
    
    function InspectionSyncTask() {
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    InspectionSyncTask.prototype.execute = function () {
        InspectionSyncService.execute();
    };

    return InspectionSyncTask;
});