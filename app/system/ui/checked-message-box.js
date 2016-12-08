define(function (require) {
    'use strict';

    var $ = require('jquery');


    var view = require('text!./views/checked-message-box.html'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        converter = require('system/lang/converter'),
        DialogViewModel = require('system/ui/dialog-view-model');

    var TAB_KEY = 9,
        ENTER_KEY = 13;

    function DontAskMessageBox(message, title, buttons, icon, checkboxText) {
        base.call(this, view);

        this.kom = new KnockoutManager();
        this.translator = Object.resolve(Translator);
        this.message = message;
        this.title = title;
        this.translator = Object.resolve(Translator);
        this.buttons = this.kom.observableArray(buttons) || null;
        this.icon = icon || 'icon-node-warning';
        this.checkboxText = checkboxText;
        this.checkboxChecked = false;
        this.checkboxValue = null;
        this.buttonIndex = 1;
        this.dfd = null;
        this.dialog = null;
        
        this.$element = null;
        this.buttonStyle = this.kom.pureComputed(buttonStyle_read.bind(null, this));
    }

    var base = Object.inherit(KnockoutViewModel, DontAskMessageBox);

    function buttonStyle_read(self) {
        var buttonCount = self.buttons().length,
            className = '';

        if (buttonCount === 2) {
            className = 'two-buttons';
        } else if (buttonCount === 3) {
            className = 'three-buttons';
        }

        return className;
    }

    /**
     * Displays a message box
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param buttons - Array of Buttons to show.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    DontAskMessageBox.show = function (message, title, buttons, icon, checkboxText) {
        var messageBox;

        buttons = buttons || [{ name: translate('OK') }];
        messageBox = new DontAskMessageBox(message, title, buttons, icon, checkboxText);

        return messageBox.showMessage();
    };

    /**
     * Displays a message box with an Ok button
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    DontAskMessageBox.showOk = function (message, title, icon, checkboxText) {
        var buttons = [{ name: translate('OK') }];

        return DontAskMessageBox.show(message, title, buttons, icon, checkboxText);
    };

    /**
     * Displays a message box with Ok and Cancel buttons
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    DontAskMessageBox.showOkCancel = function (message, title, icon, checkboxText) {
        var buttons = [{ name: translate('OK') },
                       { name: translate('CANCEL') }];

        return DontAskMessageBox.show(message, title, buttons, icon, checkboxText);
    };

    /**
     * Displays a message box with Yes and No buttons
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    DontAskMessageBox.showYesNo = function (message, title, icon, checkboxText) {
        var buttons = [{ name: translate('YES') },
                       { name: translate('NO') }];

        return DontAskMessageBox.show(message, title, buttons, icon, checkboxText);
    };

    /**
     * Displays a message box with Yes No and Cancel buttons
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    DontAskMessageBox.showYesNoCancel = function (message, title, icon, checkboxText) {
        var buttons = [{ name: translate('YES') },
                       { name: translate('NO') },
                       { name: translate('CANCEL') }];

        return DontAskMessageBox.show(message, title, buttons, icon, checkboxText);
    };

    DontAskMessageBox.prototype.showMessage = function () {
        this.dialog = new DialogViewModel(this, this.title);
        this.dfd = $.Deferred();

        this.dialog.show();
        this.$element = this.dialog.$wrapper.find('.dialog-message-box');

        setMessageBoxStyle(this);
        setFocusToFirstButton(this);

        return this.dfd;
    };

    function setMessageBoxStyle(self) {
        var $messageBoxContent = self.$element.parents('.dialog-content');
        $messageBoxContent.addClass('message-box-content');
        $messageBoxContent.siblings('.title').addClass('message-box-title');

        self.dialog.centerDialog();
    }

    function setFocusToFirstButton(self) {
        self.$element.find('.message-box-button-container > .btn:first-of-type').focus();
    }

    DontAskMessageBox.prototype.buttonClicked = function (clickedButtonIndex) {
        var self = this;

        var $checkbox = self.$element.find('#messageCheckbox');
        self.checkboxChecked = $checkbox[0].checked;
        self.buttonIndex = clickedButtonIndex;
        self.dialog.closeDialog();

        // this.dfd.resolve(clickedButtonIndex);
        this.dfd.resolve(self);
    };

    /**
     * Handles tab and enter key presses to ensure correct behaviors. Cycles tab through just the buttons and enter
     * triggers the click event for the focused button.
     * @param btn
     * @param event
     * @returns {boolean} - whether or not to prevent default handling of key press.
     */
    DontAskMessageBox.prototype.buttonKeyDown = function (btn, event) {
        var $target = $(event.target),
            $buttons = this.$element.find('.message-box-button-container > .btn');

        if (event.keyCode === ENTER_KEY) {
            $target.click();
            return false;
        } else if (event.keyCode === TAB_KEY) {
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

    DontAskMessageBox.prototype.unload = function () {
        this.kom.dispose();
    };

    function translate(key) {
        var translator = Object.resolve(Translator);

        return translator.translate(key);
    }

    return DontAskMessageBox;
});