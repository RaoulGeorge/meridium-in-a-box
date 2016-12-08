define(function (require) {
    'use strict';

    var $ = require('jquery'),
        InputDialogViewModel = require('./input-dialog-view-model'),
        DialogViewModel = require('system/ui/dialog-view-model');

    function InputDialog() {

    }

    InputDialog.prototype.show = function (message) {
        var self = this,
            dfd = $.Deferred();
        var inputDialogVM = Object.resolve(InputDialogViewModel, message);
        var dialog = new DialogViewModel(inputDialogVM, message.title, { height: '90%', width: '90%' });
        inputDialogVM.setDialog(dialog);
        dialog.show();
        inputDialogVM.onClose.add(function (fields) {
            dfd.resolve(fields);
        });
        return dfd;
    };

    return InputDialog;
});