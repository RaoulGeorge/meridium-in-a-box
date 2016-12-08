define(function (require) {
    'use strict';
    
    var MultiTask = require('./tasks/multi-task'),
        TaskLoader = require('./tasks/task-loader'),
        StartUpTasks = require('text!config/startup-tasks.json'),
        TaskConfigFile = require('./tasks/task-config-file');
    
    function ApplicationTasks() {
        var configFile = Object.resolve(TaskConfigFile, StartUpTasks);
        this.preLoginConfigs = configFile.getPreLoginTasks();
        this.postLoginConfigs = configFile.getPostLoginTasks();
        this.taskLoader = Object.resolve(TaskLoader);
    }
    
    ApplicationTasks.prototype.runPreLoginTasks = function () {
        return runTasks(this, this.preLoginConfigs);
    };

    function runTasks(self, configs) {
        return self.taskLoader.load(configs)
            .then(execute);
    }

    function execute(tasks) {
        return new MultiTask(tasks).execute();
    }

    ApplicationTasks.prototype.runPostLoginTasks = function () {
        return runTasks(this, this.postLoginConfigs);
    };
    
    return ApplicationTasks;
});
