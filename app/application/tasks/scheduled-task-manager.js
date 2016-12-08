define(function (require) {
    'use strict';

    var _ = require('lodash'),
        R = require('ramda');

    var Later = require('later');

    function ScheduledTaskManager() {
        this.actions = {};
        this.schedules = {};
        this.intervals = {};
    }
    ScheduledTaskManager.singleton = true;

    ScheduledTaskManager.prototype.addTask = function (config, task) {
        addAction(this, config.id, task);
        addSchedule(this, config.id, config.schedule);
    };

    function addAction(self, id, task) {
        self.actions[id] = task.execute.bind(task);
    }

    function addSchedule(self, id, schedule) {
        self.schedules[id] = Later.parse.text(schedule);
    }

    ScheduledTaskManager.prototype.enableTask = function (id) {
        var action = this.actions[id],
            schedule = this.schedules[id];
        if (action && schedule && R.isNil(this.intervals[id])) {
            this.intervals[id] = Later.setInterval(action, schedule);
        }
    };

    ScheduledTaskManager.prototype.disableTask = function (id) {
        var interval = this.intervals[id];
        if (interval) {
            interval.clear();
            delete this.intervals[id];
        }
    };

    ScheduledTaskManager.prototype.removeTask = function (id) {
        this.disableTask(id);
        delete this.actions[id];
        delete this.schedules[id];
    };

    ScheduledTaskManager.prototype.listTasks = function () {
        return _.keys(this.actions);
    };

    return ScheduledTaskManager;
});
