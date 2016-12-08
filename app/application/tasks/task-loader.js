define(function (require) {
    'use strict';

    var _ = require('lodash');

    var Assert = require('mi-assert'),
        ITask = require('./i-task');

    function TaskLoader() {
        // do nothing
    }

    TaskLoader.prototype.load = function (configs) {
        var modules = _.pluck(configs, 'module');
        return Object.require(modules)
            .then(convertModulesToTasks);
    };

    function convertModulesToTasks(ctors) {
        Assert.isArray(ctors, 'ctors');
        var tasks = _.map(ctors, Object.resolve);
        _.forEach(tasks, assertTask);
        return tasks;
    }

    function assertTask(task) {
        Assert.implementsInterface(task, ITask, task.constructor.toString());
    }

    return TaskLoader;
});