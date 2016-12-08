/// <amd-dependency path="text!./views/message-box.html" />

import * as $ from 'jquery';
import * as ko from 'knockout';
import {resolve} from 'system/lang/object';

import KnockoutViewModel = require('spa/knockout/knockout-view-model');
import KnockoutManager = require('system/knockout/knockout-manager');
import Translator = require('system/globalization/translator');
import DialogViewModel = require('system/ui/dialog-view-model');

const view = require('text!./views/message-box.html');
const TAB_KEY = 9;
const ENTER_KEY = 13;

class MessageBox extends KnockoutViewModel {
    /**
     * Displays a message box
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param buttons - Array of Buttons to show.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    public static show(message: string, title: string, buttons: any, icon?: string): JQueryDeferred<number> {
        buttons = buttons || [{ name: translate('OK') }];
        const messageBox = new MessageBox(message, title, buttons, icon);
        return messageBox.showMessage();
    }

    /**
     * Displays a message box with an Ok button
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    public static showOk(message: string, title: string, icon?: string): JQueryDeferred<number> {
        const buttons = [{ name: translate('OK') }];
        return MessageBox.show(message, title, buttons, icon);
    }

    /**
     * Displays a message box with Ok and Cancel buttons
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    public static showOkCancel(message: string, title: string, icon?: string): JQueryDeferred<number> {
        const buttons = [
            { name: translate('OK') },
            { name: translate('CANCEL') }
        ];
        return MessageBox.show(message, title, buttons, icon);
    }

    /**
     * Displays a message box with Yes and No buttons
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    public static showYesNo(message: string, title: string, icon?: string): JQueryDeferred<number> {
        const buttons = [
            { name: translate('YES') },
            { name: translate('NO') }
        ];
        return MessageBox.show(message, title, buttons, icon);
    }

    /**
     * Displays a message box with Yes No and Cancel buttons
     * @param message - The full text of the message.
     * @param title - The title to be displayed within the header of the message.
     * @param icon - Icon to display within the dialog.
     * @returns {Deferred} - A deferred that is resolved when the message is dismissed.
     */
    public static showYesNoCancel(message: string, title: string, icon?: string): JQueryDeferred<number> {
        const buttons = [
            { name: translate('YES') },
            { name: translate('NO') },
            { name: translate('CANCEL') }
        ];
        return MessageBox.show(message, title, buttons, icon);
    };

    public kom: KnockoutManager;
    public message: string;
    public title: string;
    public buttons: ko.ObservableArray<any>;
    public icon: string;
    public dfd: Nullable<JQueryDeferred<number>>;
    public dialog: Nullable<DialogViewModel>;
    public translator: Translator;
    public $element: Nullable<JQuery>;
    public buttonStyle: ko.PureComputed<string>;

    constructor(message: string, title: string, buttons: any, icon?: string) {
        super(view);
        this.kom = new KnockoutManager();
        this.message = message;
        this.title = title;
        this.buttons = this.kom.observableArray(buttons);
        this.icon = icon || 'icon-node-warning';
        this.dfd = null;
        this.dialog = null;
        this.translator = resolve(Translator);
        this.$element = null;
        this.buttonStyle = this.kom.pureComputed<string>(buttonStyle_read.bind(null, this));
    }

    public showMessage(): JQueryDeferred<number> {
        this.dialog = new DialogViewModel(this, this.title);
        this.dfd = $.Deferred();

        this.dialog.show();
        this.$element = this.dialog.$wrapper!.find('.dialog-message-box');

        setMessageBoxStyle(this);
        setFocusToFirstButton(this);

        return this.dfd;
    }

    public buttonClicked(clickedButtonIndex: number): void {
        this.dialog!.closeDialog();
        this.dfd!.resolve(clickedButtonIndex);
    }

    /**
     * Handles tab and enter key presses to ensure correct behaviors. Cycles tab through just the buttons and enter
     * triggers the click event for the focused button.
     * @param btn
     * @param event
     * @returns {boolean} - whether or not to prevent default handling of key press.
     */
    public buttonKeyDown(btn: HTMLButtonElement, event: KeyboardEvent): boolean {
        const $target = $(event.target);
        const $buttons = this.$element!.find('.message-box-button-container > .btn');

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

    public unload(): void {
        this.kom.dispose();
    };
}

function buttonStyle_read(messageBox: MessageBox): string {
    const buttonCount = messageBox.buttons().length;
    if (buttonCount === 2) {
        return 'two-buttons';
    } else if (buttonCount === 3) {
        return 'three-buttons';
    }
    return '';
}

function setMessageBoxStyle(messageBox: MessageBox): void {
    const $messageBoxContent = messageBox.$element!.parents('.dialog-content');
    $messageBoxContent.addClass('message-box-content');
    $messageBoxContent.siblings('.title').addClass('message-box-title');
    messageBox.dialog!.centerDialog();
}

function setFocusToFirstButton(messageBox: MessageBox): void {
    messageBox.$element!.find('.message-box-button-container > .btn:first-of-type').focus();
}

function translate(key: string): string {
    return resolve(Translator).translate(key);
}

export = MessageBox;