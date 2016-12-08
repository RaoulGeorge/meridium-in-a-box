define(function (require) {
    'use strict';

    var _ = require('lodash');

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        TaskLoader = require('./task-loader'),
        StartUpTasks = require('text!config/startup-tasks.json'),
        TaskConfigFile = require('./task-config-file');
    
    function RegisterEventsTask() {
        var configFile = Object.resolve(TaskConfigFile, StartUpTasks);
        this.configs = configFile.getDomEventTasks();
        this.taskLoader = Object.resolve(TaskLoader);
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    RegisterEventsTask.prototype.execute = function () {
        this.taskLoader.load(this.configs)
            .then(registerAllTasks.bind(null, this));
    };

    function registerAllTasks(self, tasks) {
        _.forEach(self.configs, registerTaskForAllEvents.bind(null, tasks));
    }

    function registerTaskForAllEvents(tasks, taskConfig, i) {
        var target = taskConfig.target,
            events = taskConfig.events,
            instance = tasks[i];
        _.forEach(events, registerTaskForSingleEvent.bind(null, target, instance));
    }

    function registerTaskForSingleEvent(target, instance, event) {
        var listener = instance.execute.bind(instance);
        target.addEventListener(event.trim(), listener);
    }

    return RegisterEventsTask;
});