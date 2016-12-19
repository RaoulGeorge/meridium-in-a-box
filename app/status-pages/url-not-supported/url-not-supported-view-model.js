define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        view = require('text!./views/url-not-supported.html'),
        Translator = require('system/globalization/translator');

    function URLNotSupportedViewModel(appEvents) {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
        this.titleChanged = appEvents.titleChanged;
        this.iconChanged = appEvents.iconChanged;
    }

    URLNotSupportedViewModel.dependsOn = [ApplicationEvents];

    var base = Object.inherit(KnockoutViewModel, URLNotSupportedViewModel);

    URLNotSupportedViewModel.prototype.open = function URLNotSupportedViewModel_open() {
        this.titleChanged.raise(this.translator.translate('URL_NOT_SUPPORTED'), this);
        this.iconChanged.raise('tab-icon-url-not-supported', this);
    };

    URLNotSupportedViewModel.prototype.attach = function URLNotSupportedViewModel_attach(region) {
        base.prototype.attach.call(this, region);
    };

    URLNotSupportedViewModel.prototype.detach = function URLNotSupportedViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    URLNotSupportedViewModel.prototype.translateText = function URLNotSupportedViewModel_translateText(key) {
        return this.translator.translate(key);
    };

    return URLNotSupportedViewModel;
});