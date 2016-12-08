define(function (require) {
    'use strict';

    var $ = require('jquery');


    var toastr = require('toastr'),
    ErrorDetailViewModel = require('system/error/error-detail-view-model'),
        Translator = require('system/globalization/translator'),
        DialogViewModel = require('system/ui/dialog-view-model');

    function FeedbackToast(option) {
        toastr.options = {
            positionClass: "toast-top-center",
            timeOut: '10000',
            hideDuration: '1000',
            closeButton: true
        };

    }

    FeedbackToast.prototype.info = function toast_info(message, title) {
        assignnulltoonclick();
        toastr.info(message, title);
    };

    FeedbackToast.prototype.warning = function toast_warning(message, title) {
        assignnulltoonclick();
        toastr.warning(message, title);
    };

    FeedbackToast.prototype.success = function toast_success(message, title) {
        assignnulltoonclick();
        toastr.success(message, title);

    };

    FeedbackToast.prototype.error = function toast_error(errorMessage, title) {
        var errorDetailViewModel = new ErrorDetailViewModel(errorMessage),
                dialogTitle = translate('ERROR') + ' - ' + errorMessage.code,
                errorDialog = new DialogViewModel(errorDetailViewModel, dialogTitle);
        toastr.options.onclick = function () {
            errorDialog.show();
            listenForClose(errorDialog);
        };
        toastr.error(errorMessage.message, title);
    };

    FeedbackToast.prototype.clear = function toast_clear() {
        toastr.clear();
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

    function assignnulltoonclick() {
        toastr.options.onclick = null;
    }

    return FeedbackToast;
});