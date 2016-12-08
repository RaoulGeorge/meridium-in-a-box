define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        ApplicationErrorHandler = require('application/application-error-handler');
    
    function ApplicationErrorTask() {
        this.applicationErrorHandler = Object.resolve(ApplicationErrorHandler);
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    ApplicationErrorTask.prototype.execute = function () {
        this.applicationErrorHandler.load();
    };

    return ApplicationErrorTask;
});