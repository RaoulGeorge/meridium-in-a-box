define(function (require) {
    'use strict';

    var TaskConfig = require('./task-config');

    function ScheduledTaskConfig(module, schedule, disabled, id, onlineOnly) {
        base.call(this, module);
        this.schedule = schedule;
        this.disabled = disabled || false;
        this.id = id || module;
        this.onlineOnly = onlineOnly || false;
    }
    var base = Object.inherit(TaskConfig, ScheduledTaskConfig);

    ScheduledTaskConfig.fromData = function (data) {
        return new ScheduledTaskConfig(data.module, data.schedule, data.disabled, data.id, data['online-only']);
    };

    return ScheduledTaskConfig;
});
