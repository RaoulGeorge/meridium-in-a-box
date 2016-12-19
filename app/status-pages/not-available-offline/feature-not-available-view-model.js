define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        view = require('text!./views/feature-not-available.html'),
        Translator = require('system/globalization/translator');

    function FeatureNotAvailableViewModel(appEvents) {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
        this.titleChanged = appEvents.titleChanged;
        this.iconChanged = appEvents.iconChanged;
    }

    FeatureNotAvailableViewModel.dependsOn = [ApplicationEvents];

    var base = Object.inherit(KnockoutViewModel, FeatureNotAvailableViewModel);

    FeatureNotAvailableViewModel.prototype.open = function FeatureNotAvailable_open() {
        this.titleChanged.raise(this.translator.translate('FEATURE_NOT_AVAILABLE'), this);
        this.iconChanged.raise('tab-icon-not-available-offline', this);
    };

    FeatureNotAvailableViewModel.prototype.attach = function FeatureNotAvailableViewModel_attach(region) {
        base.prototype.attach.call(this, region);
    };

    FeatureNotAvailableViewModel.prototype.detach = function FeatureNotAvailableViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    FeatureNotAvailableViewModel.prototype.translateText = function FeatureNotAvailableViewModel_translateText(key) {
        return this.translator.translate(key);
    };

    return FeatureNotAvailableViewModel;
});