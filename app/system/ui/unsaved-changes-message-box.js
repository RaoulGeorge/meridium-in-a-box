define(function (require) {
    'use strict';

    var $ = require('jquery');


    var MessageBox = require('system/ui/message-box'),
        translator = Object.resolve(require('system/globalization/translator'));

    function UnsavedChangesMessageBox() {

    }

    UnsavedChangesMessageBox.show = function unsavedChangesMessageBox_show() {
        var deferred = $.Deferred(),
            message = translator.translate('UNSAVED_CHANGES_MESSAGE') + ' ' + translator.translate('UNSAVED_CHANGES_PROMPT'),
            title = translator.translate('UNSAVED_CHANGES_TITLE');
        MessageBox.showOkCancel(message, title).done(function (buttonIndex) {
                if (buttonIndex === 0) {
                    deferred.resolve();
                }
                else {
                    deferred.reject();
                }
            });
        return deferred.promise();
    };

    return UnsavedChangesMessageBox;
});