define(function (require, exports, module) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        ApplicationContext = require('application/application-context'),
        ApplicationService = require('application/application-service');

    var TEN_MINUTES = 10 * 60 * 1000;

    function KeepAliveTask() {
        this.service = Object.resolve(ApplicationService);
        Assert.implementsInterface(this, ITask, module.id);
    }

    KeepAliveTask.prototype.execute = function () {
        ApplicationContext.connectionStatus.lastUserActivity = new Date();
        if (!isSessionActive()) { return; }
        if (!isTooLongSinceLastResponse()) { return; }
        sendKeepAliveMessage(this);
    };

    function isSessionActive() {
        return ApplicationContext.sessionStatus.isActive;
    }

    function isTooLongSinceLastResponse() {
        return getTimeSinceLastResponse() > TEN_MINUTES;
    }

    function getTimeSinceLastResponse() {
        return Date.now() - getLastResponse().getTime();
    }

    function getLastResponse() {
        return ApplicationContext.connectionStatus.lastResponse || new Date();
    }

    function sendKeepAliveMessage(self) {
        self.service.ping();
    }

    return KeepAliveTask;
});
