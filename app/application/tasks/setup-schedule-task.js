define(function (require) {
    'use strict';

    var _ = require('lodash');

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        TaskLoader = require('./task-loader'),
        StartUpTasks = require('text!config/startup-tasks.json'),
        TaskConfigFile = require('./task-config-file'),
        ScheduledTaskManager = require('./scheduled-task-manager');
    
    function ScheduleTask() {
        var configFile = Object.resolve(TaskConfigFile, StartUpTasks);
        this.configs = configFile.getScheduledTasks();
        this.taskLoader = Object.resolve(TaskLoader);
        this.taskManager = Object.resolve(ScheduledTaskManager);
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    ScheduleTask.prototype.execute = function () {
        this.taskLoader.load(this.configs)
            .then(registerAllTasks.bind(null, this));
    };

    function registerAllTasks(self, tasks) {
        _.forEach(self.configs, scheduleTask.bind(null, self, tasks));
    }

    function scheduleTask(self, tasks, config, i) {
        self.taskManager.addTask(config, tasks[i]);
        if (!config.disabled) {
            self.taskManager.enableTask(config.id);
        }
    }

    return ScheduleTask;
});