define(function (require, exports, module) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        ApplicationService = require('application/application-service'),
        R = require('ramda'),
        StartUpTasks = require('text!config/startup-tasks.json'),
        TaskConfigFile = require('application/tasks/task-config-file'),
        ScheduledTaskManager = require('application/tasks/scheduled-task-manager');

    var MILISECONDS_IN_SECOND = 1000;

    function ScheduledTaskHandler() {
        this.appEvents = Object.resolve(ApplicationEvents);
        this.service = Object.resolve(ApplicationService);
        Assert.implementsInterface(this, ITask, module.id);

        this.initialized = false;
        this.configFile = Object.resolve(TaskConfigFile, StartUpTasks);
        this.scheduledTaskManager = Object.resolve(ScheduledTaskManager);
    }

    ScheduledTaskHandler.prototype.execute = function () {
        this.initialize();
        if (lastResponseWasMoreThanThirtySecondsAgo()) {
            ping(this);
        }
    };

    function lastResponseWasMoreThanThirtySecondsAgo () {
        var delta = (now() - lastResponse()) / MILISECONDS_IN_SECOND;
        return delta > 30;
    }

    function now() {
        return new Date();
    }

    function lastResponse() {
        return ApplicationContext.connectionStatus.lastResponse;
    }

    ScheduledTaskHandler.prototype.initialize = function initialize() {
        if (!this.initialized) {
            connectionStatusChanged(this, null, ApplicationContext.connectionStatus);
            this.appEvents.connectionChanged.add(connectionStatusChanged.bind(null, this));
            this.appEvents.sessionChanged.add(sessionStatusChanged.bind(null, this));
            this.initialized = true;
        }
    };

    function sessionStatusChanged(self, sender, sessionStatus) {
        if (sessionStatus.isActive === true && ApplicationContext.connectionStatus.connected === true) {
            online(self);
        }
        else if (sessionStatus.isActive === false) {
            offline(self);
        }
    }

    function connectionStatusChanged(self, sender, connectionStatus) {
        if (connectionStatus.connected === true && ApplicationContext.sessionStatus.isActive === true) {
            online(self);
        }
        else if (connectionStatus.connected === false) {
            offline(self);
        }
    }

    function ping(self) {
        self.service.unauthorizedping();
    }

    var isOnlineOnly = R.propEq('onlineOnly', true);

    function getOnlineOnlyTasks(self) {
        return R.filter(isOnlineOnly, self.configFile.getScheduledTasks());
    }

    function online(self) {
        var tasks = getOnlineOnlyTasks(self);
        R.forEach(enableTask(self), tasks);
    }

    var enableTask = R.curry(function enableTask(self, task) {
        self.scheduledTaskManager.enableTask(task.id);
    });

    function offline(self) {
        var tasks = getOnlineOnlyTasks(self);
        R.forEach(disableTask(self), tasks);
    }

    var disableTask = R.curry(function disableTask(self, task) {
        self.scheduledTaskManager.disableTask(task.id);
    });

    return ScheduledTaskHandler;
});
