define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        AjaxEventHandler = require('application/ajax-event-handler');
    
    function AjaxEventsTask() {
        this.ajaxEventHandler = Object.resolve(AjaxEventHandler);
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    AjaxEventsTask.prototype.execute = function () {
        this.ajaxEventHandler.load();
    };

    return AjaxEventsTask;
});