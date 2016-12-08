define(function (require) {
    'use strict';

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ko = require('knockout'),
        Translator = require('system/globalization/translator'),
        PopupEditor = require('./popup-editor-view-model'),
        DialogBox = require('system/ui/dialog-box'),
        view = require('text!./long-text-view.html!strip');

    require('system/lang/object');

    function LongTextViewModel() {
        base.call(this, view);

        this.translator = Object.resolve(Translator);
        this.popupDialog = null;

        this.region = null;
        this.value = ko.observable();
        this.caption = ko.observable();
        this.placeholderText = ko.observable('---');
        this.isDisabled = ko.observable(true);
        this.cssClass = ko.observable();
        this.isValid = ko.observable(true);

        this.compositeCssClass = ko.pureComputed(compositeCssClass_read.bind(null, this));
    }
    var base = Object.inherit(KnockoutViewModel, LongTextViewModel);

    function compositeCssClass_read(self) {
        var classStr = self.isValid() ? '' : 'invalid ';
        classStr += self.cssClass();

        return classStr;
    }

    LongTextViewModel.prototype.attach = function (region) {
        this.region = region;
        base.prototype.attach.apply(this, arguments);
    };

    LongTextViewModel.prototype.detach = function () {
        if (this.popupDialog) {
            this.popupDialog.closeDialog();
            this.popupDialog = null;
        }
    };

    LongTextViewModel.prototype.enlarge = function () {
        var popupEditor = new PopupEditor(this.value(), this.placeholderText()),
            options = {
                closeIcon: true,
                height: 300,
                width: 600,
                buttons: [
                    { name: this.translator.translate('DONE'), value: 'done' }
                ]
            };
        
        this.popupDialog = new DialogBox(popupEditor, this.caption(), options);
        this.popupDialog.show()
            .done(popupEditorClosed.bind(null, this));
    };

    function popupEditorClosed(self, btnIndex, btnValue, newValue) {
        self.popupDialog = null;
        self.value(newValue);
    }

    return LongTextViewModel;
});
