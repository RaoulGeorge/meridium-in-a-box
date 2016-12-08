define(function (require) {
    'use strict';

    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        view = require('text!./input-dialog-view.html'),
        Event = require('system/lang/event'),
        FieldModel = require('./field-model');
    require('ui/elements/date-time/element');


    function InputDialogViewModel(obj) {
        base.call(this, view);
        this.region = null;
        this.dialog = null;
        this.fields = ko.observableArray();
        //this.fieldType = ko.observable(obj.fieldtype);
        //this.fieldCaption = ko.observable(obj.fieldcaption);
        this.onClose = new Event();
        this.value = ko.observable();
        this.populateFields(obj);

    }

    var base = Object.inherit(KnockoutViewModel, InputDialogViewModel);

    InputDialogViewModel.prototype.attach = function InputDialogViewModel_attach(region) {
        base.prototype.attach.call(this, region);
        this.region = region;
    };

    InputDialogViewModel.prototype.populateFields = function (obj) {
        var i;
        for (i = 0; i < obj.fields.length; i++) {
            this.fields.push(new FieldModel(obj.fields[i].fieldtype, obj.fields[i].fieldcaption));
        }
    };

    InputDialogViewModel.prototype.setDialog = function InputDialogViewModel_setDialog(dialog) {
        this.dialog = dialog;
    };

    InputDialogViewModel.prototype.onOKClicked = function InputDialogViewModel_closeHistory() {
        //this.onClose.raise(this.value());
        this.onClose.raise(ko.toJS(this.fields));
        this.dialog.closeDialog();
    };

    InputDialogViewModel.prototype.onCANCELClicked = function InputDialogViewModel_closeHistory() {
        this.dialog.closeDialog();
    };

    return InputDialogViewModel;
});