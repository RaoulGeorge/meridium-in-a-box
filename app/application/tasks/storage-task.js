define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        Storage = require('system/data/storage');
    
    function StorageTask() {
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    StorageTask.prototype.execute = function () {
        var storage = Object.resolve(Storage);
        storage.open();
    };

    return StorageTask;
});