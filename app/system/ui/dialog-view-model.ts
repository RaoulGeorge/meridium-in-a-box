/// <amd-dependency path="text!./views/dialog.html" />

import * as $ from 'jquery';
import * as ko from 'knockout';

import Conductor = require('spa/conductor');
import Region = require('spa/region');
import ApplicationEvents = require('application/application-events');
import {resolve} from 'system/lang/object';

const view = require('text!./views/dialog.html');
let zindexPrefix = 0;

interface DialogViewModelOptions {
    height: number;
    width: number;
    closeIcon: boolean;
}

class DialogViewModel {
    public options: Nullable<DialogViewModelOptions>;
    public content: any;
    public title: string;
    public showHelp: ko.Observable<boolean>;
    public showClose: ko.Observable<boolean>;
    public showCloseIcon: ko.Observable<boolean>;
    public showCheck: ko.Observable<boolean>;
    public applicationEvents: ApplicationEvents;
    public dialogShellRegion: Region;
    public dialogContentRegion: Region;
    public $wrapper: Nullable<JQuery>;
    public conductor: Conductor;

    constructor(content: any, title: string, options: Nullable<DialogViewModelOptions> = null) {
        this.options = options;
        this.content = content;
        this.title = title;
        this.showHelp = ko.observable(true);
        this.showClose = ko.observable(true);
        this.showCloseIcon = ko.observable(false);
        this.showCheck = ko.observable(true);
        this.applicationEvents = resolve(ApplicationEvents);
        this.dialogShellRegion = new Region(null);
        this.dialogContentRegion = new Region(null);
        this.$wrapper = null;
        this.conductor = resolve(Conductor);
    }

    public show(): void {
        const div = document.createElement('div');
        document.body.appendChild(div);
        this.dialogShellRegion.setElement(div);
        this.dialogShellRegion.attach($(view));
        ko.applyBindings(this, this.dialogShellRegion.activeContainer);

        this.$wrapper = this.dialogShellRegion.$element!.find('.dialog-wrapper');
        this.dialogContentRegion.setElement(this.$wrapper.find('.dialog-content'));

        if (this.options) {
            if (this.options.height) {
                this.$wrapper.css('height', this.options.height);
            }
            if (this.options.width) {
                this.$wrapper.css('width', this.options.width);
            }
        }

        if (this.options && this.options.hasOwnProperty('closeIcon')) {
            this.showCloseIcon(this.options.closeIcon);
        }

        zindexPrefix++;
        this.dialogShellRegion.$element!.find('.dialog-opacity-style').css('z-index', zindexPrefix.toString() + '98');
        this.dialogShellRegion.$element!.find('.dialog-opacity-style')
            .on('touchstart', swallowOpacityClickEvents.bind(null));

        this.$wrapper.css('z-index', zindexPrefix.toString() + '99');

        this.conductor.changeScreen(this.content, this.dialogContentRegion);

        centerDialog(this);

        this.applicationEvents.windowResized.add(centerDialog, this, this);

        this.$wrapper.find('div.dialog-message-box div.btn.btn-primary').each(settingTabIndexAndAddClass.bind(null));

        this.$wrapper.find('.okButtonClass').hover(mousein.bind(null, this), mouseout.bind(null, this));

        this.$wrapper.find('.cancelButtonClass').hover(mousein.bind(null, this), mouseout.bind(null, this));

        scopeTabIndex(this);
    };

    public closeDialog(): void {
        disableScopedTabIndex(this);
        closeDialog(this);
        zindexPrefix--;
    }

    public centerDialog(): void {
        centerDialog(this);
    }

    public setContent(content: any): void {
        this.content = content;
        this.conductor.changeScreen(this.content, this.dialogContentRegion);
        centerDialog(this);
    };
}

function closeDialog(vm: DialogViewModel): void {
    vm.dialogShellRegion.$element!.find('.dialog-opacity-style').off('touchstart');
    vm.conductor.clearScreen(vm.dialogContentRegion);
    ko.cleanNode(vm.dialogShellRegion.activeContainer);
    vm.dialogShellRegion.clear();
    vm.dialogShellRegion.$element!.remove();

    vm.applicationEvents.windowResized.remove(vm);
    vm.applicationEvents.navigate.remove(vm);
}

function centerDialog(vm: DialogViewModel): void {
    let top, left, windowHeight, windowWidth, dialogWidth, dialogHeight;

    window.scrollTo(0, 0);

    // work around bug in mobile safari where $(window).height() returns wrong value in landscape mode.
    windowHeight = window.innerHeight ? window.innerHeight : $(window).height();
    windowWidth = window.innerWidth ? window.innerWidth : $(window).width();

    dialogHeight = vm.$wrapper!.outerHeight();
    dialogWidth = vm.$wrapper!.outerWidth();

    top = Math.max(0, ((windowHeight - dialogHeight) / 2) + $(window).scrollTop());
    left = Math.max(0, ((windowWidth - dialogWidth) / 2) + $(window).scrollLeft());

    vm.$wrapper!.css('top', top + 'px');
    vm.$wrapper!.css('left', left  + 'px');
}

function swallowOpacityClickEvents(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
}

/*This function sets the focus on OK
 Button and adds class on OK and Cancel button*/
function settingTabIndexAndAddClass(idx: number, msgButton: HTMLElement): void {
    const $msgButton = $(msgButton);
    $msgButton.attr('tabindex', idx + 1);
    if ($msgButton.text() === 'OK') {
        $msgButton.addClass('okButtonClass');
        $msgButton.focus();
    }
    if ($msgButton.text() === 'Cancel') {
        $msgButton.addClass('cancelButtonClass');
    }
}

function mousein(button: HTMLElement): void {
    $(button).focus();
}

function mouseout (button: HTMLElement): void {
    $(button).blur();
}

function scopeTabIndex(vm: DialogViewModel): void {
    vm.$wrapper!.keydown(function(event: KeyboardEvent): void {
        // Find the form based elements in the current Dialog
        const formElements = $(event.currentTarget).find('input, select, textarea, button');
        const firstElement = formElements.first();
        const lastElement = formElements.last();

        if((event.which || event.keyCode) === 9){
            if(event.shiftKey && firstElement.length && firstElement.is(':focus')){
                event.preventDefault();
                lastElement.focus();
            }
            if(!event.shiftKey && lastElement.length && lastElement.is(':focus')){
                event.preventDefault();
                firstElement.focus();
            }
        }
    });
}

function disableScopedTabIndex(vm: DialogViewModel): void {
    vm.$wrapper!.off('keydown');
}

export = DialogViewModel;
