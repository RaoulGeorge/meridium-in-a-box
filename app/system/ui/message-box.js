/// <amd-dependency path="text!./views/message-box.html" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "jquery", "system/lang/object", "spa/knockout/knockout-view-model", "system/knockout/knockout-manager", "system/globalization/translator", "system/ui/dialog-view-model", "text!./views/message-box.html"], function (require, exports, $, object_1, KnockoutViewModel, KnockoutManager, Translator, DialogViewModel) {
    "use strict";
    var view = require('text!./views/message-box.html');
    var TAB_KEY = 9;
    var ENTER_KEY = 13;
    var MessageBox = (function (_super) {
        __extends(MessageBox, _super);
        function MessageBox(message, title, buttons, icon) {
            var _this = _super.call(this, view) || this;
            _this.kom = new KnockoutManager();
            _this.message = message;
            _this.title = title;
            _this.buttons = _this.kom.observableArray(buttons);
            _this.icon = icon || 'icon-node-warning';
            _this.dfd = null;
            _this.dialog = null;
            _this.translator = object_1.resolve(Translator);
            _this.$element = null;
            _this.buttonStyle = _this.kom.pureComputed(buttonStyle_read.bind(null, _this));
            return _this;
        }
        /**
         * Displays a message box
         * @param message - The full text of the message.
         * @param title - The title to be displayed within the header of the message.
         * @param buttons - Array of Buttons to show.
         * @param icon - Icon to display within the dialog.
         * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
         */
        MessageBox.show = function (message, title, buttons, icon) {
            buttons = buttons || [{ name: translate('OK') }];
            var messageBox = new MessageBox(message, title, buttons, icon);
            return messageBox.showMessage();
        };
        /**
         * Displays a message box with an Ok button
         * @param message - The full text of the message.
         * @param title - The title to be displayed within the header of the message.
         * @param icon - Icon to display within the dialog.
         * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
         */
        MessageBox.showOk = function (message, title, icon) {
            var buttons = [{ name: translate('OK') }];
            return MessageBox.show(message, title, buttons, icon);
        };
        /**
         * Displays a message box with Ok and Cancel buttons
         * @param message - The full text of the message.
         * @param title - The title to be displayed within the header of the message.
         * @param icon - Icon to display within the dialog.
         * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
         */
        MessageBox.showOkCancel = function (message, title, icon) {
            var buttons = [
                { name: translate('OK') },
                { name: translate('CANCEL') }
            ];
            return MessageBox.show(message, title, buttons, icon);
        };
        /**
         * Displays a message box with Yes and No buttons
         * @param message - The full text of the message.
         * @param title - The title to be displayed within the header of the message.
         * @param icon - Icon to display within the dialog.
         * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
         */
        MessageBox.showYesNo = function (message, title, icon) {
            var buttons = [
                { name: translate('YES') },
                { name: translate('NO') }
            ];
            return MessageBox.show(message, title, buttons, icon);
        };
        /**
         * Displays a message box with Yes No and Cancel buttons
         * @param message - The full text of the message.
         * @param title - The title to be displayed within the header of the message.
         * @param icon - Icon to display within the dialog.
         * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
         */
        MessageBox.showYesNoCancel = function (message, title, icon) {
            var buttons = [
                { name: translate('YES') },
                { name: translate('NO') },
                { name: translate('CANCEL') }
            ];
            return MessageBox.show(message, title, buttons, icon);
        };
        ;
        MessageBox.prototype.showMessage = function () {
            this.dialog = new DialogViewModel(this, this.title);
            this.dfd = $.Deferred();
            this.dialog.show();
            this.$element = this.dialog.$wrapper.find('.dialog-message-box');
            setMessageBoxStyle(this);
            setFocusToFirstButton(this);
            return this.dfd;
        };
        MessageBox.prototype.buttonClicked = function (clickedButtonIndex) {
            this.dialog.closeDialog();
            this.dfd.resolve(clickedButtonIndex);
        };
        /**
         * Handles tab and enter key presses to ensure correct behaviors. Cycles tab through just the buttons and enter
         * triggers the click event for the focused button.
         * @param btn
         * @param event
         * @returns {boolean} - whether or not to prevent default handling of key press.
         */
        MessageBox.prototype.buttonKeyDown = function (btn, event) {
            var $target = $(event.target);
            var $buttons = this.$element.find('.message-box-button-container > .btn');
            if (event.keyCode === ENTER_KEY) {
                $target.click();
                return false;
            }
            else if (event.keyCode === TAB_KEY) {
                if ($target.is(':last-of-type') && event.shiftKey === false) {
                    $buttons.first().focus();
                    return false;
                }
                if ($target.is(':first-of-type') && event.shiftKey === true) {
                    $buttons.last().focus();
                    return false;
                }
            }
            return true;
        };
        ;
        MessageBox.prototype.unload = function () {
            this.kom.dispose();
        };
        ;
        return MessageBox;
    }(KnockoutViewModel));
    function buttonStyle_read(messageBox) {
        var buttonCount = messageBox.buttons().length;
        if (buttonCount === 2) {
            return 'two-buttons';
        }
        else if (buttonCount === 3) {
            return 'three-buttons';
        }
        return '';
    }
    function setMessageBoxStyle(messageBox) {
        var $messageBoxContent = messageBox.$element.parents('.dialog-content');
        $messageBoxContent.addClass('message-box-content');
        $messageBoxContent.siblings('.title').addClass('message-box-title');
        messageBox.dialog.centerDialog();
    }
    function setFocusToFirstButton(messageBox) {
        messageBox.$element.find('.message-box-button-container > .btn:first-of-type').focus();
    }
    function translate(key) {
        return object_1.resolve(Translator).translate(key);
    }
    return MessageBox;
});
