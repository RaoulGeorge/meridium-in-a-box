define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        toastr = require('toastr');
    
    function ToastrTask() {
        Assert.implementsInterface(this, ITask, 'this');
    }
    
    ToastrTask.prototype.execute = function () {
        toastr.options = {
            positionClass: "toast-top-center",
            timeOut: '5000',
            showDuration: '300',
            hideDuration: '1000',
            showMethod: 'fadeIn',
            hideMethod: 'fadeOut',
            closeButton: true
        };
    };

    return ToastrTask;
});