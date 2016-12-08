define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        WindowEventHandler = require('application/window-event-handler');
    
    function WindowEventsTask() {
        this.windowEventHandler = Object.resolve(WindowEventHandler);
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    WindowEventsTask.prototype.execute = function () {
        this.windowEventHandler.load();
    };

    return WindowEventsTask;
});