define(function (require) {
    'use strict';

    var _ = require('lodash');

    var TaskConfig = require('./task-config');

    function EventTaskConfig(module, events, target) {
        base.call(this, module);
        this.events = events;
        this.target = target;
    }
    var base = Object.inherit(TaskConfig, EventTaskConfig);

    EventTaskConfig.fromData = function (data) {
        var events = _.invoke(data.events.split(','), 'trim'),
            target = mapTarget(data);
        return new EventTaskConfig(data.module, events, target);
    };

    function mapTarget(config) {
        if (config.target === 'window') { return window; }
        return window.document;
    }

    return EventTaskConfig;
});