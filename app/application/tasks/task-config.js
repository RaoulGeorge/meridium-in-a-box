define(function () {
    'use strict';

    function TaskConfig(module) {
        this.module = module;
    }

    TaskConfig.fromData = function (data) {
        return new TaskConfig(data.module);
    };

    return TaskConfig;
});