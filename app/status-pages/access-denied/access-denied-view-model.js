define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        view = require('text!./views/access-denied.html'),
        Translator = require('system/globalization/translator');

    function AccessDeniedViewModel(appEvents) {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
        this.titleChanged = appEvents.titleChanged;
        this.iconChanged = appEvents.iconChanged;
    }

    AccessDeniedViewModel.dependsOn = [ApplicationEvents];

    var base = Object.inherit(KnockoutViewModel, AccessDeniedViewModel);

    AccessDeniedViewModel.prototype.open = function AccessDeniedViewModel_open() {
        this.titleChanged.raise(this.translator.translate('ACCESS_DENIED'), this);
        this.iconChanged.raise('tab-icon-access-denied', this);
    };

    AccessDeniedViewModel.prototype.translateText = function AccessDeniedViewModel_translateText(key) {
        return this.translator.translate(key);
    };

    return AccessDeniedViewModel;
});