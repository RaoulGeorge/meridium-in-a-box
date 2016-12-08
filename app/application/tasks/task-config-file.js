define(function (require) {
    'use strict';

    var _ = require('lodash');

    var TaskConfig = require('./task-config'),
        EventTaskConfig = require('./event-task-config'),
        ScheduledTaskConfig = require('./scheduled-task-config');

    function TaskConfigFile(json) {
        this.data = JSON.parse(json);
    }

    TaskConfigFile.prototype.getScheduledTasks = function () {
        var tasks = getSection(this, 'scheduled').tasks;
        return _.map(tasks, ScheduledTaskConfig.fromData);
    };

    TaskConfigFile.prototype.getDomEventTasks = function () {
        var tasks = getSection(this, 'dom-events').tasks;
        return _.map(tasks, EventTaskConfig.fromData);
    };

    TaskConfigFile.prototype.getPreLoginTasks = function () {
        var tasks = getSection(this, 'pre-login').tasks;
        return _.map(tasks, TaskConfig.fromData);
    };

    TaskConfigFile.prototype.getPostLoginTasks = function () {
        var tasks = getSection(this, 'post-login').tasks;
        return _.map(tasks, TaskConfig.fromData);
    };

    function getSection(self, section) {
        return self.data[section];
    }

    return TaskConfigFile;
});