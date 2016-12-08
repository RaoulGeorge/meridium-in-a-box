define(function (require) {
    'use strict';

    var $ = require('jquery'),
        toastr = require('toastr'),
        ErrorDetailViewModel = require('system/error/error-detail-view-model'),
        ErrorMessage = require('system/error/error-message'),
        Translator = require('system/globalization/translator'),
        DialogViewModel = require('system/ui/dialog-view-model');

    function FeedbackComponent(option) {
        toastr.options = {
            positionClass: "toast-top-center",
            timeOut: '10000',
            hideDuration: '1000',
            closeButton: true
        };
    }

    FeedbackComponent.prototype.info = function toast_info(message, title) {
        assignnulltoonclick();
        toastr.info(message, title);
    };

    FeedbackComponent.prototype.warning = function toast_warning(message, title) {
        assignnulltoonclick();
        toastr.warning(message, title);
    };

    FeedbackComponent.prototype.success = function toast_success(message, title) {
        assignnulltoonclick();
        toastr.success(message, title);
    };

    FeedbackComponent.prototype.error = function toast_error(errorMessage, title) {
        var errorDetailViewModel = new ErrorDetailViewModel(errorMessage),
            dialogTitle = translate('ERROR') + ' - ' + errorMessage.code,
            errorDialog = new DialogViewModel(errorDetailViewModel, dialogTitle, { 'height': '90%' });

        toastr.options.onclick = function () {
            errorDialog.show();
            listenForClose(errorDialog);
        };
        toastr.error(errorMessage.message, title);
    };

    FeedbackComponent.prototype.errorMessageFromResponse = function (response) {
        var errorMessage = new ErrorMessage(0, scrubResponseText(response.responseText));
        FeedbackComponent.prototype.error(errorMessage);
    };

    FeedbackComponent.prototype.errorMessageFromResponseWithDetails = function (details, response) {
        var errorMessage = new ErrorMessage(0, scrubResponseText(response.responseText), details);
        FeedbackComponent.prototype.error(errorMessage);
    };

    FeedbackComponent.prototype.errorDetailsFromResponse = function (message, response) {
        var errorMessage = new ErrorMessage(0, message, scrubResponseText(response.responseText));
        FeedbackComponent.prototype.error(errorMessage);
    };

    FeedbackComponent.prototype.clear = function toast_clear() {
        toastr.clear();
    };

    function scrubResponseText(responseText) {
        if (responseText[0] === '"' && responseText[responseText.length - 1] === '"') {
            responseText = responseText.substring(1, responseText.length - 1);
        }
        return responseText;
    }

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

    return FeedbackComponent;
});