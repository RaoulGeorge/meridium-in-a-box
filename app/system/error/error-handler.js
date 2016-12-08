define(function (require) {
    'use strict';

    var $ = require('jquery');


    var Toast = require('logging/feedback-component/feedback-component'),
        ErrorDetailViewModel = require('system/error/error-detail-view-model'),
        Translator = require('system/globalization/translator'),
        DialogViewModel = require('system/ui/dialog-view-model');

    function ErrorHandler() {
        //does nothing
    }

    ErrorHandler.singleton = true;

    ErrorHandler.prototype.show = function errorHandler_show(errorMessage) {
        if (errorMessage) {
            var errorDetailViewModel = new ErrorDetailViewModel(errorMessage),
                dialogTitle = translate('ERROR') + ' - ' + errorMessage.code,
                errorDialog = new DialogViewModel(errorDetailViewModel, dialogTitle),
                toast = new Toast({
                    'closeButton': true,
                    'timeOut': '20000',
                    'hideDuration': '0',
                    onclick: function () {
                        errorDialog.show();
                        listenForClose(errorDialog);
                    }
                });

            toast.error(errorMessage);
        }
    };

    function listenForClose(errorDialog) {
        $('.error-dialog-close').click(function () {
            errorDialog.closeDialog();
        });
    }

    function translate(key) {
        var translator = Object.resolve(Translator);

        return translator.translate(key);
    }

    return ErrorHandler;
});