define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        view = require('text!./views/under-construction-popup.html');

    function UnderConstructionPopupViewModel(appEvents) {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
    }

    UnderConstructionPopupViewModel.dependsOn = [ApplicationEvents];

    var base = Object.inherit(KnockoutViewModel, UnderConstructionPopupViewModel);

    UnderConstructionPopupViewModel.prototype.open = function UnderConstructionPopupViewModel_open() {

    };

    UnderConstructionPopupViewModel.prototype.attach = function UnderConstructionPopupViewModel_attach(region) {
        base.prototype.attach.call(this, region);
    };

    UnderConstructionPopupViewModel.prototype.load = function UnderConstructionPopupViewModel_load(args) {

    };

    UnderConstructionPopupViewModel.prototype.detach = function UnderConstructionPopupViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    UnderConstructionPopupViewModel.prototype.unload = function UnderConstructionPopupViewModel_unload() {

    };

    UnderConstructionPopupViewModel.translateText = function UnderConstructionPopupViewModel_translateText(key) {
        return this.translator.translate(key);
    };

    return UnderConstructionPopupViewModel;
});