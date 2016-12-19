define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        view = require('text!./views/under-construction.html'),
        Translator = require('system/globalization/translator'),
        DialogBox = require('system/ui/dialog-box'),
        DialogScreen = require('./under-construction-popup-view-model'),
        DialogOptions = {
            buttons: [
                { name: 'OK', value: 'cancel', cssClass: 'btn-default'}
            ],
            closeOnReject: true
        };

    function UnderConstructionViewModel(appEvents) {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
        this.titleChanged = appEvents.titleChanged;
        this.dialogScreen = Object.resolve(DialogScreen);
        this.dialog = new DialogBox(this.dialogScreen, 'dialog title', DialogOptions);
        this.show = function(){
            this.dialog.show();
        };
    }

    UnderConstructionViewModel.dependsOn = [ApplicationEvents];

    var base = Object.inherit(KnockoutViewModel, UnderConstructionViewModel);

    UnderConstructionViewModel.prototype.open = function UnderConstructionViewModel_open() {
        this.titleChanged.raise(this.translator.translate('UNDER_CONSTRUCTION'), this);
    };

    UnderConstructionViewModel.prototype.attach = function UnderConstructionViewModel_attach(region) {
        base.prototype.attach.call(this, region);
    };

    UnderConstructionViewModel.prototype.load = function UnderConstructionViewModel_load(args) {

    };

    UnderConstructionViewModel.prototype.detach = function UnderConstructionViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    UnderConstructionViewModel.prototype.unload = function UnderConstructionViewModel_unload() {

    };

    UnderConstructionViewModel.prototype.translateText = function UnderConstructionViewModel_translateText(key) {
        return this.translator.translate(key);
    };

    return UnderConstructionViewModel;
});