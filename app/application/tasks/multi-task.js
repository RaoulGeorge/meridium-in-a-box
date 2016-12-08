define(function (require) {
    'use strict';

    var _ = require('lodash'),
        Promise = require('bluebird');

    var Assert = require('mi-assert'),
        ITask = require('./i-task');
    
    function MultiTask(tasks) {
        Assert.isArray(tasks, 'tasks');
        this.tasks = tasks;
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    MultiTask.prototype.execute = function () {
        return Promise.all(_.invoke(this.tasks, 'execute'));
    };

    return MultiTask;
});